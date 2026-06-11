"""
ASGI config for server project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
import socketio
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

# Import the sio instance from our ws module
from server.ws import sio

django_asgi_app = get_asgi_application()

# Wrap ASGI app with Socket.IO ASGIApp middleware
application = socketio.ASGIApp(sio, django_asgi_app)
