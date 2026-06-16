from django.urls import path
from .models import CaseDetailView, CreateReferralView, UpdateCaseStepView

urlpatterns = [
    path('case/<str:case_id>/',              CaseDetailView.as_view(),    name='case_detail'),
    path('case/<str:case_id>/referral/',     CreateReferralView.as_view(),name='create_referral'),
    path('steps/<uuid:pk>/',                 UpdateCaseStepView.as_view(),name='update_step'),
]
