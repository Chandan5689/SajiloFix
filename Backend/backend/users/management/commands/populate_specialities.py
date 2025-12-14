# users/management/commands/populate_specialities.py
from django.core.management.base import BaseCommand
from users.models import Speciality, Specialization
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'Populate specialities and specializations'

    def handle(self, *args, **kwargs):
        specialities_data = [
            {
                'name': 'Plumbing',
                'slug': 'plumbing',
                'description': 'Professional plumbing services',
                'specializations': [
                    'Residential Plumbing', 
                    'Commercial Plumbing', 
                    'Emergency Repairs',
                    'Pipe Installation', 
                    'Bathroom Renovation', 
                    'Kitchen Plumbing',
                    'Water Heater Service', 
                    'Drain Cleaning', 
                    'Leak Detection',
                    'Sewer Line Repair', 
                    'Water Filtration',
                ]
            },
            {
                'name': 'Electrical',
                'slug': 'electrical',
                'description': 'Licensed electrical services',
                'specializations': [
                    'Residential Wiring', 
                    'Commercial Wiring', 
                    'Emergency Electrical',
                    'Panel Upgrades', 
                    'Lighting Installation', 
                    'Outlet Repair',
                    'Generator Installation',
                    'Ceiling Fan Installation',
                    'Home Automation',
                    'Electrical Inspection',
                ]
            },
            {
                'name': 'Carpentry',
                'slug': 'carpentry',
                'description': 'Expert carpentry and woodwork',
                'specializations': [
                    'Furniture Making',
                    'Cabinet Installation',
                    'Door Installation',
                    'Window Installation',
                    'Deck Building',
                    'Framing',
                    'Trim Work',
                    'Custom Woodwork',
                ]
            },
            {
                'name': 'AC Repair',
                'slug': 'ac-repair',
                'description': 'Air conditioning services',
                'specializations': [
                    'AC Installation',
                    'AC Maintenance',
                    'AC Repair',
                    'Central AC',
                    'Split AC',
                    'Window AC',
                    'AC Gas Refilling',
                    'Duct Cleaning',
                ]
            },
            {
                'name': 'Painting',
                'slug': 'painting',
                'description': 'Professional painting services',
                'specializations': [
                    'Interior Painting',
                    'Exterior Painting',
                    'Commercial Painting',
                    'Residential Painting',
                    'Wallpaper Installation',
                    'Texture Painting',
                    'Spray Painting',
                ]
            },
            {
                'name': 'Cleaning',
                'slug': 'cleaning',
                'description': 'Home and office cleaning',
                'specializations': [
                    'House Cleaning',
                    'Office Cleaning',
                    'Deep Cleaning',
                    'Carpet Cleaning',
                    'Window Cleaning',
                    'Move-in/Move-out Cleaning',
                ]
            },
        ]

        for spec_data in specialities_data:
            speciality, created = Speciality.objects.get_or_create(
                slug=spec_data['slug'],
                defaults={
                    'name': spec_data['name'],
                    'description': spec_data.get('description', '')
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Created speciality: {speciality.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'- Speciality already exists: {speciality.name}'))
            
            for spec_name in spec_data['specializations']:
                specialization, created = Specialization.objects.get_or_create(
                    speciality=speciality,
                    name=spec_name
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Created specialization: {spec_name}'))
        
        self.stdout.write(self.style.SUCCESS('\n🎉 Successfully populated specialities and specializations!'))