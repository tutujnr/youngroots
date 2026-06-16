"""
YoungRoots — Management Command: seed_data
Populates the database with sample services and a test admin user.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, UserRole
from apps.locator.models import Service, Country, ServiceCategory, ServiceStatus
from apps.reports.models import Report, ReportType, UrgencyLevel
from apps.referrals.models import CaseStep, create_default_steps


SAMPLE_COUNTRIES = [
    {'code': 'KE', 'name': 'Kenya'},
    {'code': 'UG', 'name': 'Uganda'},
    {'code': 'TZ', 'name': 'Tanzania'},
    {'code': 'GH', 'name': 'Ghana'},
    {'code': 'ZA', 'name': 'South Africa'},
    {'code': 'NG', 'name': 'Nigeria'},
]

SAMPLE_SERVICES = [
    {
        'name': 'Kenyatta National Youth Clinic',
        'category': ServiceCategory.CLINIC,
        'description': 'Comprehensive SRHR services for young people, including contraception, STI testing, and counselling. Free services for under-24.',
        'short_desc': 'Full SRHR clinic — free for under-24',
        'region': 'Nairobi Central',
        'address': 'Hospital Rd, Nairobi',
        'phone': '+254 20 272 6300',
        'is_free': True,
        'serves_ages': '10-24',
        'languages': ['en', 'sw'],
        'operating_hours': {'mon': '8am-6pm', 'tue': '8am-6pm', 'wed': '8am-6pm', 'thu': '8am-6pm', 'fri': '8am-6pm', 'sat': '9am-1pm'},
        'services_offered': ['Contraception', 'STI Testing', 'HIV Testing', 'Counselling', 'Family Planning'],
        'country_code': 'KE',
        'status': ServiceStatus.ACTIVE,
    },
    {
        'name': 'CHS Free HIV Testing Centre',
        'category': ServiceCategory.HIV_TESTING,
        'description': 'Confidential and free HIV testing, counselling, and linkage to ART. Same-day results. No appointment needed.',
        'short_desc': 'Free HIV testing — same-day results',
        'region': 'Westlands, Nairobi',
        'address': 'Westlands Rd, Nairobi',
        'phone': '+254 722 000 000',
        'hotline': '0800 723 100',
        'is_free': True,
        'serves_ages': '15-35',
        'languages': ['en', 'sw'],
        'operating_hours': {'mon': '9am-5pm', 'tue': '9am-5pm', 'wed': '9am-5pm', 'thu': '9am-5pm', 'fri': '9am-5pm', 'sat': '9am-3pm', 'sun': '10am-2pm'},
        'services_offered': ['HIV Testing', 'HIV Counselling', 'ART Linkage', 'PrEP'],
        'country_code': 'KE',
        'status': ServiceStatus.ACTIVE,
    },
    {
        'name': 'Gender Violence Recovery Centre',
        'category': ServiceCategory.GBV_SUPPORT,
        'description': '24/7 support for GBV survivors. Services include legal aid, medical care, psychosocial support, and safe shelter referrals.',
        'short_desc': 'GBV support — legal, medical & counselling',
        'region': 'Karen, Nairobi',
        'address': 'Karen Hospital Rd, Nairobi',
        'phone': '+254 722 111 111',
        'hotline': '1195',
        'is_free': True,
        'serves_ages': '10-35',
        'languages': ['en', 'sw'],
        'operating_hours': {'mon': '24hrs', 'tue': '24hrs', 'wed': '24hrs', 'thu': '24hrs', 'fri': '24hrs', 'sat': '24hrs', 'sun': '24hrs'},
        'services_offered': ['GBV Support', 'Legal Aid', 'Medical Care', 'Psychosocial Support', 'Safe Shelter'],
        'country_code': 'KE',
        'status': ServiceStatus.ACTIVE,
    },
    {
        'name': 'Befrienders Kenya',
        'category': ServiceCategory.MENTAL_HEALTH,
        'description': 'Anonymous mental health support and crisis counselling for young people 24/7. Peer support groups available weekly.',
        'short_desc': 'Anonymous mental health & crisis support',
        'region': 'Kilimani, Nairobi',
        'address': 'Ralph Bunche Rd, Nairobi',
        'hotline': '+254 722 178 177',
        'is_free': True,
        'serves_ages': '10-30',
        'languages': ['en'],
        'operating_hours': {'mon': '24hrs', 'tue': '24hrs', 'wed': '24hrs', 'thu': '24hrs', 'fri': '24hrs', 'sat': '24hrs', 'sun': '24hrs'},
        'services_offered': ['Crisis Counselling', 'Mental Health', 'Peer Support'],
        'country_code': 'KE',
        'status': ServiceStatus.ACTIVE,
    },
    {
        'name': 'Marie Stopes Youth Hub',
        'category': ServiceCategory.FAMILY_PLANNING,
        'description': 'Family planning, contraception, safe abortion services, antenatal care and SGBV support in a youth-safe environment.',
        'short_desc': 'Family planning & reproductive health',
        'region': 'Kibera, Nairobi',
        'address': 'Kibera Drive, Nairobi',
        'phone': '+254 20 387 5445',
        'is_free': False,
        'serves_ages': '15-35',
        'languages': ['en', 'sw'],
        'operating_hours': {'mon': '7am-7pm', 'tue': '7am-7pm', 'wed': '7am-7pm', 'thu': '7am-7pm', 'fri': '7am-7pm', 'sat': '8am-4pm'},
        'services_offered': ['Contraception', 'Family Planning', 'Safe Abortion', 'Antenatal Care', 'GBV Support'],
        'country_code': 'KE',
        'status': ServiceStatus.ACTIVE,
    },
]


class Command(BaseCommand):
    help = 'Seed the database with sample data for development and demo'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Clear existing data before seeding')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write('Clearing existing data...')
            Service.objects.all().delete()
            Country.objects.all().delete()
            User.objects.filter(email__contains='@youngroots.demo').delete()

        # Countries
        self.stdout.write('Creating countries...')
        countries = {}
        for c in SAMPLE_COUNTRIES:
            obj, _ = Country.objects.get_or_create(code=c['code'], defaults={'name': c['name']})
            countries[c['code']] = obj

        # Services
        self.stdout.write('Creating services...')
        for svc_data in SAMPLE_SERVICES:
            country_code = svc_data.pop('country_code')
            svc_data['country'] = countries.get(country_code)
            Service.objects.get_or_create(name=svc_data['name'], defaults=svc_data)

        # Users
        self.stdout.write('Creating demo users...')
        admin_user, created = User.objects.get_or_create(
            email='admin@youngroots.demo',
            defaults={'display_name': 'System Admin', 'role': UserRole.SUPER_ADMIN, 'is_staff': True, 'is_superuser': True}
        )
        if created:
            admin_user.set_password('AdminPass2024!')
            admin_user.save()

        advocate, created = User.objects.get_or_create(
            email='advocate@youngroots.demo',
            defaults={'display_name': 'Demo Advocate', 'role': UserRole.ADVOCATE}
        )
        if created:
            advocate.set_password('AdvocatePass2024!')
            advocate.save()

        # Sample reports
        self.stdout.write('Creating sample reports...')
        if not Report.objects.exists():
            for i, (rtype, urgency, location) in enumerate([
                (ReportType.ACCESS_DENIED, UrgencyLevel.MODERATE, 'Nairobi County'),
                (ReportType.GBV, UrgencyLevel.URGENT, 'Kisumu County'),
                (ReportType.DISCRIMINATION, UrgencyLevel.LOW, 'Mombasa County'),
            ]):
                report = Report.objects.create(
                    report_type=rtype,
                    description='Sample report for demonstration purposes. This is a test entry.',
                    location_area=location,
                    urgency=urgency,
                    status='active' if i < 2 else 'resolved',
                    assigned_to=advocate,
                )
                create_default_steps(report)

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Seed complete!\n'
            f'   Services: {Service.objects.count()}\n'
            f'   Countries: {Country.objects.count()}\n'
            f'   Reports: {Report.objects.count()}\n'
            f'\nDemo credentials:\n'
            f'   Admin:    admin@youngroots.demo / AdminPass2024!\n'
            f'   Advocate: advocate@youngroots.demo / AdvocatePass2024!\n'
        ))
