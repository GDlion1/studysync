from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Group, GroupMember, GroupGoal, ChatMessage, StudyResource, StudySession

class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    user_id = serializers.CharField(read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'user_id', 'full_name', 'usn', 'avatar_url', 'branch', 
            'semester', 'language', 'mother_tongue', 'location', 'gender', 'bio'
        ]

class MiniProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'full_name', 'avatar_url', 'usn']

class GroupSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    profiles = MiniProfileSerializer(source='admin', read_only=True)
    creator_id = serializers.CharField(read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'type', 'subject_code', 'mother_tongue', 'creator_id', 'profiles']

class GroupMemberSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True)
    user_id = serializers.CharField(source='user.user_id', read_only=True)
    profiles = MiniProfileSerializer(source='user', read_only=True)

    class Meta:
        model = GroupMember
        fields = ['id', 'group_id', 'user_id', 'profiles', 'role']

class GroupGoalSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True)

    class Meta:
        model = GroupGoal
        fields = ['id', 'group_id', 'title', 'due_date', 'priority', 'status']

class ChatMessageSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True)
    sender_id = serializers.CharField(source='user.user_id', read_only=True)
    profiles = MiniProfileSerializer(source='user', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'group_id', 'sender_id', 'content', 'message_type', 'file_url', 'created_at', 'profiles']

class StudyResourceSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    group_id = serializers.IntegerField(source='group.id', allow_null=True, read_only=True)
    file_path = serializers.CharField(source='file_url', read_only=True)
    profiles = MiniProfileSerializer(source='uploaded_by', read_only=True)
    uploaded_by = serializers.IntegerField(source='uploaded_by.id', read_only=True)

    class Meta:
        model = StudyResource
        fields = [
            'id', 'group_id', 'title', 'file_url', 'file_path', 'file_type', 
            'file_size', 'subject_code', 'subject_name', 'branch', 'semester', 
            'profiles', 'uploaded_by', 'created_at'
        ]

class MiniGroupSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'type', 'subject_code']

class StudySessionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    group_id = serializers.IntegerField(source='group.id', allow_null=True, read_only=True)
    groups = MiniGroupSerializer(source='group', read_only=True)

    class Meta:
        model = StudySession
        fields = ['id', 'title', 'group_id', 'start_time', 'end_time', 'session_type', 'created_by', 'groups']
