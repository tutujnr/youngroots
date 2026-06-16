# ── urls.py ───────────────────────────────────────────────────────────────────
from django.urls import path
from . import views

urlpatterns = [
    path('submit/',                         views.SubmitReportView.as_view(),         name='submit_report'),
    path('lookup/<str:case_id>/',           views.CaseLookupView.as_view(),           name='case_lookup'),
    path('admin/',                          views.AdminReportListView.as_view(),       name='admin_reports'),
    path('admin/<uuid:pk>/',               views.AdminReportDetailView.as_view(),     name='admin_report_detail'),
    path('admin/<uuid:report_id>/notes/',  views.AddReportNoteView.as_view(),         name='add_report_note'),
]
