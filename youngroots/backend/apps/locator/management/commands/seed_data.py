from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User, UserRole
from apps.locator.models import Service, Country, ServiceCategory, ServiceStatus
from apps.reports.models import Report, ReportType, UrgencyLevel
from apps.referrals.models import create_default_steps
from apps.notes.models import Note, NoteCategory
from apps.blog.models import BlogPost
from apps.events.models import Event
from datetime import timedelta


class Command(BaseCommand):
    help = 'Seed demo data'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true')

    def handle(self, *args, **options):
        if options['reset']:
            Service.objects.all().delete()
            Country.objects.all().delete()
            Note.objects.all().delete()
            BlogPost.objects.all().delete()
            Event.objects.all().delete()
            User.objects.filter(email__contains='@youngroots.demo').delete()

        ke, _ = Country.objects.get_or_create(code='KE', defaults={'name': 'Kenya'})

        services = [
            ('Kenyatta National Youth Clinic', ServiceCategory.CLINIC, 'Nairobi Central', True),
            ('CHS Free HIV Testing Centre', ServiceCategory.HIV_TESTING, 'Westlands', True),
            ('Gender Violence Recovery Centre', ServiceCategory.GBV_SUPPORT, 'Karen', True),
            ('Befrienders Kenya', ServiceCategory.MENTAL_HEALTH, 'Kilimani', True),
            ('Marie Stopes Youth Hub', ServiceCategory.FAMILY_PLANNING, 'Kibera', False),
        ]
        for name, cat, region, free in services:
            Service.objects.get_or_create(name=name, defaults={
                'category': cat, 'region': region, 'country': ke, 'is_free': free,
                'description': f'{name} provides youth-friendly SRHR services.',
                'short_desc': f'{cat} services in {region}',
                'status': ServiceStatus.ACTIVE,
            })

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

        if not Report.objects.exists():
            for rtype, urgency, location in [
                (ReportType.ACCESS_DENIED, UrgencyLevel.MODERATE, 'Nairobi County'),
                (ReportType.GBV, UrgencyLevel.URGENT, 'Kisumu County'),
            ]:
                report = Report.objects.create(
                    report_type=rtype, description='Sample report for demonstration.',
                    location_area=location, urgency=urgency, status='active', assigned_to=advocate,
                )
                create_default_steps(report)

        notes_data = [
            ('Contraception 101: Know Your Options', NoteCategory.CONTRACEPTION, 'A quick guide to condoms, the pill, implants, and IUDs.'),
            ('Know Your Rights at the Clinic', NoteCategory.RIGHTS, 'You have the right to confidential, non-judgmental care.'),
            ('Recognising the Signs of GBV', NoteCategory.GBV, 'GBV is not always physical — learn the signs.'),
            ('HIV Testing: What to Expect', NoteCategory.HIV, 'Testing is free, confidential, and takes 15-20 minutes.'),
        ]
        for title, cat, summary in notes_data:
            Note.objects.get_or_create(title=title, defaults={'category': cat, 'summary': summary, 'body': summary + ' ' * 3})

        BlogPost.objects.get_or_create(title='Why Anonymous Reporting Changes Everything', defaults={
            'excerpt': 'How removing identity from reporting increased disclosures 3x.',
            'body': 'Full article body here...', 'cover_emoji': '📰',
        })
        BlogPost.objects.get_or_create(title='Meet Yara: Building an AI That Listens', defaults={
            'excerpt': 'The design choices behind our AI health guide.',
            'body': 'Full article body here...', 'cover_emoji': '🤖',
        })

        Event.objects.get_or_create(title='Youth SRHR Advocacy Training', defaults={
            'description': 'A full-day training for peer educators.',
            'event_date': timezone.now() + timedelta(days=10),
            'location': 'Nairobi Community Hall', 'format': 'in_person',
        })

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Seed complete! Services: {Service.objects.count()} · Notes: {Note.objects.count()} · '
            f'Blog: {BlogPost.objects.count()} · Events: {Event.objects.count()}\n'
            f'Admin: admin@youngroots.demo / AdminPass2024!\n'
            f'Advocate: advocate@youngroots.demo / AdvocatePass2024!\n'
        ))
