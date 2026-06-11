import jwt
import datetime
from django.conf import settings
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage

from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Profile, Group, GroupMember, GroupGoal, ChatMessage, StudyResource, StudySession
from .serializers import (
    ProfileSerializer, GroupSerializer, GroupMemberSerializer, 
    GroupGoalSerializer, ChatMessageSerializer, StudyResourceSerializer, 
    StudySessionSerializer
)

# ─── Helper Functions ────────────────────────────────────────────────────────
def generate_token(user):
    payload = {
        'id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


# ─── Auth Views ──────────────────────────────────────────────────────────────
@api_view(['POST'])
def signup(request):
    email = request.data.get('email')
    password = request.data.get('password')
    full_name = request.data.get('full_name', '')
    usn = request.data.get('usn', '')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Use email as username since username is required in Django
        user = User.objects.create_user(username=email, email=email, password=password)
        
        profile = Profile.objects.create(
            user=user,
            full_name=full_name,
            usn=usn,
            avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={full_name or email}"
        )

        serializer = ProfileSerializer(profile)
        return Response({
            '_id': str(user.id),
            'email': user.email,
            'profile': serializer.data,
            'token': generate_token(user),
            'message': 'Signup successful!'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.filter(email=email).first()
        if user and user.check_password(password):
            profile, created = Profile.objects.get_or_create(
                user=user,
                defaults={'full_name': email.split('@')[0], 'avatar_url': f"https://api.dicebear.com/7.x/initials/svg?seed={email}"}
            )
            serializer = ProfileSerializer(profile)
            return Response({
                '_id': str(user.id),
                'email': user.email,
                'profile': serializer.data,
                'token': generate_token(user),
                'message': 'Login successful!'
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({'error': f'Server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT'])
def profile_detail(request, user_id):
    user = get_object_or_404(User, id=user_id)
    profile, created = Profile.objects.get_or_create(user=user)

    if request.method == 'GET':
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Group Views ─────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
def groups_list(request):
    if request.method == 'GET':
        group_type = request.query_params.get('type')
        if group_type:
            groups = Group.objects.filter(type=group_type)
        else:
            groups = Group.objects.all()
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        name = request.data.get('name')
        description = request.data.get('description', '')
        group_type = request.data.get('type', 'universal')
        creator_id = request.data.get('creator_id')
        mother_tongue = request.data.get('mother_tongue', '')
        subject_code = request.data.get('subject_code', '')

        user = get_object_or_404(User, id=creator_id)
        profile, _ = Profile.objects.get_or_create(user=user)

        group = Group.objects.create(
            name=name,
            description=description,
            type=group_type,
            mother_tongue=mother_tongue,
            subject_code=subject_code,
            admin=profile,
            creator_id=str(user.id)
        )

        # Auto-add creator to group members
        GroupMember.objects.create(group=group, user=profile, role='admin')

        serializer = GroupSerializer(group)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def group_memberships(request, user_id):
    user = get_object_or_404(User, id=user_id)
    profile, _ = Profile.objects.get_or_create(user=user)
    memberships = GroupMember.objects.filter(user=profile)
    serializer = GroupMemberSerializer(memberships, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def join_group(request):
    group_id = request.data.get('groupId')
    user_id = request.data.get('userId')

    group = get_object_or_404(Group, id=group_id)
    user = get_object_or_404(User, id=user_id)
    profile, _ = Profile.objects.get_or_create(user=user)

    member, created = GroupMember.objects.get_or_create(group=group, user=profile)
    return Response({'success': True}, status=status.HTTP_200_OK)


@api_view(['POST'])
def request_group(request):
    # Mocked backend approval endpoint
    return Response({'success': True, 'message': 'Request processing'})


# ─── Hub / Details / Members Views ───────────────────────────────────────────
@api_view(['GET', 'PUT'])
def hub_details(request, group_id):
    group = get_object_or_404(Group, id=group_id)

    if request.method == 'GET':
        serializer = GroupSerializer(group)
        return Response(serializer.data)

    elif request.method == 'PUT':
        name = request.data.get('name')
        description = request.data.get('description', '')
        group.name = name
        group.description = description
        group.save()
        serializer = GroupSerializer(group)
        return Response(serializer.data)


@api_view(['GET'])
def hub_members(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    members = GroupMember.objects.filter(group=group)
    serializer = GroupMemberSerializer(members, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
def remove_member(request, group_id, user_id):
    group = get_object_or_404(Group, id=group_id)
    user = get_object_or_404(User, id=user_id)
    profile, _ = Profile.objects.get_or_create(user=user)

    GroupMember.objects.filter(group=group, user=profile).delete()
    return Response({'success': True})


@api_view(['POST'])
def invite_member(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    usn = request.data.get('usn')
    
    profile = Profile.objects.filter(usn=usn).first()
    if not profile:
        return Response({'error': 'Student not found with this USN'}, status=status.HTTP_404_NOT_FOUND)

    if GroupMember.objects.filter(group=group, user=profile).exists():
        return Response({'error': 'Student already in group'}, status=status.HTTP_400_BAD_REQUEST)

    GroupMember.objects.create(group=group, user=profile)
    serializer = ProfileSerializer(profile)
    return Response({'success': True, 'profile': serializer.data}, status=status.HTTP_201_CREATED)


# ─── Chat Messages Views ─────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
def hub_messages(request, group_id):
    group = get_object_or_404(Group, id=group_id)

    if request.method == 'GET':
        messages = ChatMessage.objects.filter(group=group).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        sender_id = request.data.get('sender_id')
        content = request.data.get('content', '')
        message_type = request.data.get('message_type', 'text')
        file_url = request.data.get('file_url', None)

        user = get_object_or_404(User, id=sender_id)
        profile, _ = Profile.objects.get_or_create(user=user)

        message = ChatMessage.objects.create(
            group=group,
            user=profile,
            content=content,
            message_type=message_type,
            file_url=file_url
        )

        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─── Group Goals Views ───────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
def hub_goals(request, group_id):
    group = get_object_or_404(Group, id=group_id)

    if request.method == 'GET':
        goals = GroupGoal.objects.filter(group=group).order_by('due_date')
        serializer = GroupGoalSerializer(goals, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        title = request.data.get('title')
        due_date = request.data.get('due_date', '')
        priority = request.data.get('priority', 'medium')
        created_by_id = request.data.get('created_by')

        user = get_object_or_404(User, id=created_by_id)
        profile, _ = Profile.objects.get_or_create(user=user)

        goal = GroupGoal.objects.create(
            group=group,
            title=title,
            due_date=due_date,
            priority=priority,
            created_by=profile
        )

        serializer = GroupGoalSerializer(goal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
def update_goal(request, group_id, goal_id):
    goal = get_object_or_404(GroupGoal, id=goal_id)
    status_val = request.data.get('status')
    if status_val:
        goal.status = status_val
        goal.save()
    serializer = GroupGoalSerializer(goal)
    return Response(serializer.data)


# ─── Study Resources (Files) Views ───────────────────────────────────────────
@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def hub_resources(request, group_id):
    group = get_object_or_404(Group, id=group_id)

    if request.method == 'GET':
        resources = StudyResource.objects.filter(group=group).order_by('-created_at')
        serializer = StudyResourceSerializer(resources, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        uploader_id = request.data.get('uploader_id')
        user = get_object_or_404(User, id=uploader_id)
        profile, _ = Profile.objects.get_or_create(user=user)

        filename = default_storage.save(f"uploads/{file_obj.name}", file_obj)
        file_url = f"http://127.0.0.1:8000/uploads/{filename.replace('uploads/', '')}"

        ext = file_obj.name.split('.')[-1].lower()
        if ext in ['jpg', 'jpeg', 'png', 'gif']:
            file_type = 'image'
        elif ext == 'pdf':
            file_type = 'pdf'
        else:
            file_type = 'file'

        resource = StudyResource.objects.create(
            group=group,
            title=file_obj.name,
            file_url=file_url,
            file_type=file_type,
            file_size=file_obj.size,
            uploaded_by=profile
        )

        serializer = StudyResourceSerializer(resource)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def resources_list(request):
    if request.method == 'GET':
        subject_code = request.query_params.get('subject_code')
        branch = request.query_params.get('branch')
        semester = request.query_params.get('semester')

        query = {}
        if subject_code: query['subject_code'] = subject_code
        if branch: query['branch'] = branch
        if semester: query['semester'] = semester

        resources = StudyResource.objects.filter(**query).order_by('-created_at')
        serializer = StudyResourceSerializer(resources, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Handles post upload route: /api/resources/upload
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        title = request.data.get('title', file_obj.name)
        subject_code = request.data.get('subject_code', '')
        subject_name = request.data.get('subject_name', '')
        branch = request.data.get('branch', '')
        semester = request.data.get('semester', '')
        uploaded_by_id = request.data.get('uploaded_by')

        user = get_object_or_404(User, id=uploaded_by_id)
        profile, _ = Profile.objects.get_or_create(user=user)

        filename = default_storage.save(f"uploads/{file_obj.name}", file_obj)
        file_url = f"http://127.0.0.1:8000/uploads/{filename.replace('uploads/', '')}"

        ext = file_obj.name.split('.')[-1].lower()
        resource = StudyResource.objects.create(
            title=title,
            subject_code=subject_code,
            subject_name=subject_name,
            branch=branch,
            semester=semester,
            file_url=file_url,
            file_type=ext,
            file_size=file_obj.size,
            uploaded_by=profile
        )

        serializer = StudyResourceSerializer(resource)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def delete_resource(request, id):
    resource = get_object_or_404(StudyResource, id=id)
    resource.delete()
    return Response({'success': True})


# ─── Schedule Views ──────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
def schedule_list(request):
    if request.method == 'GET':
        sessions = StudySession.objects.all().order_by('start_time')
        serializer = StudySessionSerializer(sessions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        title = request.data.get('title')
        group_id = request.data.get('group_id')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        session_type = request.data.get('session_type')
        created_by = request.data.get('created_by')

        group = Group.objects.filter(id=group_id).first() if group_id else None

        session = StudySession.objects.create(
            title=title,
            group=group,
            start_time=start_time,
            end_time=end_time,
            session_type=session_type,
            created_by=created_by
        )

        serializer = StudySessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def schedule_memberships(request, user_id):
    user = get_object_or_404(User, id=user_id)
    profile, _ = Profile.objects.get_or_create(user=user)

    memberships = GroupMember.objects.filter(user=profile)
    groups = [m.group for m in memberships]
    
    # Format to match frontend schedule page expectation (list of group objects)
    formatted = [{
        'id': g.id,
        'name': g.name,
        'type': g.type,
        'subject_code': g.subject_code
    } for g in groups]

    return Response(formatted)
