from django.urls import path
from . import views

urlpatterns = [
    # Auth Endpoints
    path('auth/signup', views.signup, name='signup'),
    path('auth/login', views.login, name='login'),
    path('auth/profile/<int:user_id>', views.profile_detail, name='profile_detail'),

    # Groups Endpoints
    path('groups', views.groups_list, name='groups_list'),
    path('groups/memberships/<int:user_id>', views.group_memberships, name='group_memberships'),
    path('groups/join', views.join_group, name='join_group'),
    path('groups/request', views.request_group, name='request_group'),

    # Hub Endpoints
    path('hub/<int:group_id>/details', views.hub_details, name='hub_details'),
    path('hub/<int:group_id>/members', views.hub_members, name='hub_members'),
    path('hub/<int:group_id>/members/<int:user_id>', views.remove_member, name='remove_member'),
    path('hub/<int:group_id>/invite', views.invite_member, name='invite_member'),
    path('hub/<int:group_id>/messages', views.hub_messages, name='hub_messages'),
    path('hub/<int:group_id>/goals', views.hub_goals, name='hub_goals'),
    path('hub/<int:group_id>/goals/<int:goal_id>', views.update_goal, name='update_goal'),
    path('hub/<int:group_id>/resources', views.hub_resources, name='hub_resources'),
    path('hub/<int:group_id>/requests', views.request_group, name='hub_requests'),

    # Resources Endpoints
    path('resources', views.resources_list, name='resources_list'),
    path('resources/upload', views.resources_list, name='resources_upload'),
    path('resources/<int:id>', views.delete_resource, name='delete_resource'),

    # Schedule Endpoints
    path('schedule', views.schedule_list, name='schedule_list'),
    path('schedule/memberships/<int:user_id>', views.schedule_memberships, name='schedule_memberships'),
]
