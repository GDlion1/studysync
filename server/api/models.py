from django.db import models
from django.contrib.auth.models import User

# ─── Profile ─────────────────────────────────────────────────────────────────
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255, default='', blank=True)
    usn = models.CharField(max_length=100, default='', blank=True)
    avatar_url = models.TextField(default='', blank=True)
    branch = models.CharField(max_length=100, default='', blank=True)
    semester = models.CharField(max_length=50, default='', blank=True)
    language = models.CharField(max_length=100, default='English', blank=True)
    mother_tongue = models.CharField(max_length=100, default='Kannada', blank=True)
    location = models.CharField(max_length=255, default='', blank=True)
    gender = models.CharField(max_length=100, default='Male', blank=True)
    bio = models.TextField(default='', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def user_id(self):
        return str(self.user.id)

    def __str__(self):
        return self.full_name or self.user.email


# ─── Group ────────────────────────────────────────────────────────────────────
class Group(models.Model):
    GROUP_TYPES = (
        ('universal', 'Universal'),
        ('private', 'Private'),
    )
    name = models.CharField(max_length=255)
    description = models.TextField(default='', blank=True)
    type = models.CharField(max_length=50, choices=GROUP_TYPES, default='universal')
    subject_code = models.CharField(max_length=100, default='', blank=True)
    mother_tongue = models.CharField(max_length=100, default='', blank=True)
    admin = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='administered_groups')
    creator_id = models.CharField(max_length=100, default='', blank=True) # User's ID string
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ─── GroupMember ──────────────────────────────────────────────────────────────
class GroupMember(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=100, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user.full_name} in {self.group.name}"


# ─── GroupGoal ────────────────────────────────────────────────────────────────
class GroupGoal(models.Model):
    PRIORITIES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    STATUSES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=255)
    due_date = models.CharField(max_length=100, default='', blank=True)
    priority = models.CharField(max_length=50, choices=PRIORITIES, default='medium')
    status = models.CharField(max_length=50, choices=STATUSES, default='pending')
    created_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ─── ChatMessage ──────────────────────────────────────────────────────────────
class ChatMessage(models.Model):
    MESSAGE_TYPES = (
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('pdf', 'PDF'),
    )
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='chat_messages')
    content = models.TextField(default='', blank=True)
    message_type = models.CharField(max_length=50, choices=MESSAGE_TYPES, default='text')
    file_url = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name}: {self.content[:30]}"


# ─── StudyResource ────────────────────────────────────────────────────────────
class StudyResource(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True, related_name='resources')
    title = models.CharField(max_length=255)
    file_url = models.TextField(default='', blank=True)
    file_type = models.CharField(max_length=100, default='file')
    file_size = models.IntegerField(default=0)
    subject_code = models.CharField(max_length=100, default='', blank=True)
    subject_name = models.CharField(max_length=255, default='', blank=True)
    branch = models.CharField(max_length=100, default='', blank=True)
    semester = models.CharField(max_length=50, default='', blank=True)
    uploaded_by = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='resources')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ─── StudySession ─────────────────────────────────────────────────────────────
class StudySession(models.Model):
    title = models.CharField(max_length=255)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True, related_name='sessions')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    session_type = models.CharField(max_length=100, default='group')
    created_by = models.CharField(max_length=100, default='', blank=True) # User's ID string
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
