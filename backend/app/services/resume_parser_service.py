import os
import re
import asyncio
from typing import Dict, Any, Optional
from pathlib import Path
import pdfplumber
from docx import Document


class ResumeParserService:
    
    @staticmethod
    def _normalize_month(month: str) -> str:
        """Normalize month names to full format (January, February, etc.)"""
        month_lower = month.lower().strip()
        month_map = {
            'jan': 'January', 'january': 'January',
            'feb': 'February', 'february': 'February',
            'mar': 'March', 'march': 'March',
            'apr': 'April', 'april': 'April',
            'may': 'May',
            'jun': 'June', 'june': 'June',
            'jul': 'July', 'july': 'July',
            'aug': 'August', 'august': 'August',
            'sep': 'September', 'sept': 'September', 'september': 'September',
            'oct': 'October', 'october': 'October',
            'nov': 'November', 'november': 'November',
            'dec': 'December', 'december': 'December'
        }
        return month_map.get(month_lower, month.title())
    
    @staticmethod
    async def parse_resume(file_path: str) -> Dict[str, Any]:
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext == '.pdf':
            text = await ResumeParserService._extract_text_from_pdf(file_path)
        elif file_ext in ['.docx', '.doc']:
            text = await ResumeParserService._extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
        
        return ResumeParserService._extract_data_from_text(text)
    
    @staticmethod
    async def _extract_text_from_pdf(file_path: str) -> str:
        loop = asyncio.get_event_loop()
        
        def extract():
            text = ""
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                raise Exception(f"Error reading PDF: {str(e)}")
            return text
        
        return await loop.run_in_executor(None, extract)
    
    @staticmethod
    async def _extract_text_from_docx(file_path: str) -> str:
        loop = asyncio.get_event_loop()
        
        def extract():
            try:
                doc = Document(file_path)
                text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
                return text
            except Exception as e:
                raise Exception(f"Error reading DOCX: {str(e)}")
        
        return await loop.run_in_executor(None, extract)
    
    @staticmethod
    def _extract_data_from_text(text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        
        name = ResumeParserService._extract_name(text)
        name_parts = name.split() if name else []
        
        extracted_data = {
            "name": name,
            "first_name": name_parts[0] if name_parts else None,
            "last_name": " ".join(name_parts[1:]) if len(name_parts) > 1 else None,
            "email": ResumeParserService._extract_email(text),
            "phone": ResumeParserService._extract_phone(text),
            "address": ResumeParserService._extract_address(text),
            "location": ResumeParserService._extract_location(text),
            "skills": ResumeParserService._extract_skills(text),
            "experience": ResumeParserService._extract_experience(text),
            "education": ResumeParserService._extract_education(text),
            "structured_employment": ResumeParserService._extract_structured_employment(text),
            "structured_education": ResumeParserService._extract_structured_education(text),
            "online_profiles": ResumeParserService._extract_online_profiles(text),
            "summary": ResumeParserService._extract_summary(text),
            "full_text": text
        }
        
        return extracted_data
    
    @staticmethod
    def _extract_name(text: str) -> Optional[str]:
        lines = text.split('\n')
        for line in lines[:5]:
            line = line.strip()
            if len(line) > 2 and len(line) < 50:
                if not any(keyword in line.lower() for keyword in ['email', 'phone', 'address', 'resume', 'cv']):
                    if re.match(r'^[A-Z][a-z]+(\s+[A-Z][a-z]+)+', line):
                        return line
        return None
    
    @staticmethod
    def _extract_email(text: str) -> Optional[str]:
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        matches = re.findall(email_pattern, text)
        return matches[0] if matches else None
    
    @staticmethod
    def _extract_phone(text: str) -> Optional[str]:
        phone_patterns = [
            r'\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}',
            r'\(\d{3}\)\s?\d{3}[-.\s]?\d{4}',
        ]
        
        for pattern in phone_patterns:
            matches = re.findall(pattern, text)
            if matches:
                return matches[0].strip()
        return None
    
    @staticmethod
    def _extract_address(text: str) -> Optional[Dict[str, str]]:
        address_patterns = [
            r'(\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Place|Pl)[\s,]+[A-Za-z\s,]+(?:[A-Z]{2})?\s+\d{5}(?:-\d{4})?)',
        ]
        
        for pattern in address_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                return {"full": matches[0]}
        return None
    
    @staticmethod
    def _extract_skills(text: str) -> list:
        found_skills = []
        text_lower = text.lower()
        
        skill_keywords = [
            'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
            'scala', 'r', 'matlab', 'perl', 'shell', 'bash', 'powershell',
            'react', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'fastapi', 'spring', 'laravel',
            'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'jquery',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'oracle', 'sqlite', 'dynamodb',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd', 'terraform', 'ansible',
            'linux', 'unix', 'nginx', 'apache',
            'machine learning', 'deep learning', 'data science', 'analytics', 'pandas', 'numpy', 'tensorflow',
            'pytorch', 'scikit-learn', 'spark', 'hadoop', 'kafka',
            'agile', 'scrum', 'kanban', 'devops', 'microservices', 'rest api', 'graphql',
            'project management', 'leadership', 'communication', 'teamwork', 'problem solving'
        ]
        
        for skill in skill_keywords:
            if skill in text_lower:
                found_skills.append(skill.title())
        
        skills_patterns = [
            r'(?:skills|technical skills|competencies|technologies|tools|expertise)[:]\s*(.+?)(?:\n\n|\n(?:[A-Z][a-z]+\s+[A-Z]|experience|education|projects|$))',
            r'(?:skills|technical skills|competencies|technologies|tools|expertise)\s*\n(.+?)(?:\n\n|\n(?:[A-Z][a-z]+\s+[A-Z]|experience|education|projects|$))',
        ]
        
        for pattern in skills_patterns:
            skills_section = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if skills_section:
                skills_text = skills_section.group(1)
                skills_list = re.split(r'[,;•\n|/]', skills_text)
                for skill in skills_list:
                    skill = skill.strip()
                    skill = re.sub(r'^(years?|yrs?|proficient|experienced?|expert|advanced|intermediate|beginner)[:\s]*', '', skill, flags=re.IGNORECASE)
                    skill = skill.strip('•-•\t ')
                    if skill and len(skill) > 1 and len(skill) < 50:
                        if skill.isupper():
                            skill = skill.title()
                        elif skill.islower():
                            skill = skill.title()
                        found_skills.append(skill)
        
        seen = set()
        unique_skills = []
        for skill in found_skills:
            skill_lower = skill.lower()
            if skill_lower not in seen:
                seen.add(skill_lower)
                unique_skills.append(skill)
        
        return unique_skills
    
    @staticmethod
    def _extract_experience(text: str) -> list:
        experience = []
        
        exp_section = re.search(r'(?:experience|work experience|employment)[:]\s*(.+?)(?:\n\n(?:education|skills)|$)', text, re.IGNORECASE | re.DOTALL)
        if exp_section:
            exp_text = exp_section.group(1)
            jobs = re.split(r'\n(?=[A-Z][a-z]+\s+[A-Z]|.*\d{4})', exp_text)
            for job in jobs[:5]:
                if len(job.strip()) > 20:
                    experience.append(job.strip())
        
        return experience
    
    @staticmethod
    def _extract_structured_employment(text: str) -> list:
        """Extract structured employment data for Quick Apply"""
        employment = []
        
        # Find employment section
        exp_section = re.search(r'(?:experience|work experience|employment)[:]\s*(.+?)(?:\n\n(?:education|skills)|$)', text, re.IGNORECASE | re.DOTALL)
        if not exp_section:
            return employment
        
        exp_text = exp_section.group(1)
        lines = exp_text.split('\n')
        
        current_job = {}
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Detect job entry start (company name or title)
            # Pattern: Title at Company or Company - Title
            job_match = re.match(r'^(.+?)(?:\s+at\s+|\s*[-–—]\s*|,\s*)(.+?)$', line, re.IGNORECASE)
            if job_match:
                if current_job:
                    employment.append(current_job)
                title = job_match.group(1).strip()
                company = job_match.group(2).strip()
                current_job = {
                    "company": company,
                    "title": title,
                    "start_month": "",
                    "start_year": "",
                    "end_month": "",
                    "end_year": "",
                    "current": False
                }
            elif current_job:
                # Try to extract dates
                date_pattern = r'(\w+)\s+(\d{4})\s*(?:[-–—]|to|present|current|now)'
                date_match = re.search(date_pattern, line, re.IGNORECASE)
                if date_match:
                    month = ResumeParserService._normalize_month(date_match.group(1))
                    year = date_match.group(2)
                    if not current_job.get("start_month"):
                        current_job["start_month"] = month
                        current_job["start_year"] = year
                    else:
                        if 'present' in line.lower() or 'current' in line.lower() or 'now' in line.lower():
                            current_job["current"] = True
                        else:
                            current_job["end_month"] = month
                            current_job["end_year"] = year
                # Check for end date or current
                elif re.search(r'(present|current|now)', line, re.IGNORECASE):
                    current_job["current"] = True
        
        if current_job:
            employment.append(current_job)
        
        return employment[:10]  # Limit to 10 entries
    
    @staticmethod
    def _extract_structured_education(text: str) -> list:
        """Extract structured education data for Quick Apply"""
        education = []
        
        # Find education section
        edu_section = re.search(r'(?:education|academic)[:]\s*(.+?)(?:\n\n(?:experience|skills)|$)', text, re.IGNORECASE | re.DOTALL)
        if not edu_section:
            return education
        
        edu_text = edu_section.group(1)
        lines = edu_text.split('\n')
        
        current_edu = {}
        for line in lines:
            line = line.strip()
            if not line:
                if current_edu:
                    education.append(current_edu)
                    current_edu = {}
                continue
            
            # Detect degree pattern: Degree in Discipline or Discipline, Degree
            degree_match = re.search(r'(bachelor|master|phd|doctorate|associate|diploma|certificate)[\s\']*(?:of|in)?\s*(?:science|arts|engineering|business|technology)?\s*(?:in\s*)?([^,]+)', line, re.IGNORECASE)
            if degree_match:
                if current_edu:
                    education.append(current_edu)
                degree_type = degree_match.group(1).strip().lower()
                discipline = degree_match.group(2).strip() if len(degree_match.groups()) > 1 else ""
                
                # Map to frontend format
                degree_map = {
                    'bachelor': "Bachelor's Degree",
                    'master': "Master's Degree",
                    'phd': 'PhD',
                    'doctorate': 'PhD',
                    'associate': "Associate's Degree",
                    'diploma': 'High School',
                    'certificate': 'High School'
                }
                degree_formatted = degree_map.get(degree_type, degree_type.title())
                
                current_edu = {
                    "school": "",
                    "degree": degree_formatted,
                    "discipline": discipline,
                    "start_month": "",
                    "start_year": "",
                    "end_month": "",
                    "end_year": ""
                }
            
            # Extract school name (usually before degree or on separate line)
            if not current_edu.get("school"):
                # Look for university/college names
                school_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:University|College|Institute|School|Academy))?)', line)
                if school_match and 'degree' not in line.lower():
                    current_edu["school"] = school_match.group(1)
            
            # Extract dates
            date_pattern = r'(\w+)\s+(\d{4})\s*(?:[-–—]|to)'
            date_match = re.search(date_pattern, line, re.IGNORECASE)
            if date_match and current_edu:
                month = ResumeParserService._normalize_month(date_match.group(1))
                year = date_match.group(2)
                if not current_edu.get("start_month"):
                    current_edu["start_month"] = month
                    current_edu["start_year"] = year
                else:
                    current_edu["end_month"] = month
                    current_edu["end_year"] = year
        
        if current_edu:
            education.append(current_edu)
        
        return education[:10]  # Limit to 10 entries
    
    @staticmethod
    def _extract_location(text: str) -> Optional[str]:
        """Extract location/city from resume"""
        # Look for location patterns
        location_patterns = [
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*(?:\d{5})?',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)',
        ]
        
        for pattern in location_patterns:
            matches = re.findall(pattern, text)
            if matches:
                location = ", ".join(matches[0])
                return location
        
        return None
    
    @staticmethod
    def _extract_online_profiles(text: str) -> Dict[str, str]:
        """Extract LinkedIn, GitHub, portfolio URLs"""
        profiles = {
            "linkedin": "",
            "github": "",
            "portfolio": "",
            "website": ""
        }
        
        # LinkedIn
        linkedin_match = re.search(r'linkedin\.com/in/([^\s/]+)', text, re.IGNORECASE)
        if linkedin_match:
            profiles["linkedin"] = f"https://www.linkedin.com/in/{linkedin_match.group(1)}"
        
        # GitHub
        github_match = re.search(r'github\.com/([^\s/]+)', text, re.IGNORECASE)
        if github_match:
            profiles["github"] = f"https://github.com/{github_match.group(1)}"
        
        # Portfolio/Website
        url_pattern = r'(https?://[^\s]+)'
        urls = re.findall(url_pattern, text)
        for url in urls:
            if 'linkedin' not in url.lower() and 'github' not in url.lower():
                if 'portfolio' in url.lower() or not profiles.get("portfolio"):
                    profiles["portfolio"] = url
                if not profiles.get("website"):
                    profiles["website"] = url
        
        return profiles
    
    @staticmethod
    def _extract_education(text: str) -> list:
        education = []
        
        edu_section = re.search(r'(?:education|academic)[:]\s*(.+?)(?:\n\n(?:experience|skills)|$)', text, re.IGNORECASE | re.DOTALL)
        if edu_section:
            edu_text = edu_section.group(1)
            degrees = re.split(r'\n', edu_text)
            for degree in degrees[:5]:
                if len(degree.strip()) > 10:
                    education.append(degree.strip())
        
        return education
    
    @staticmethod
    def _extract_summary(text: str) -> Optional[str]:
        summary_patterns = [
            r'(?:summary|objective|profile)[:]\s*(.+?)(?:\n\n(?:experience|education|skills)|$)',
            r'(?:about|overview)[:]\s*(.+?)(?:\n\n|$)',
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                summary = match.group(1).strip()
                if len(summary) > 20:
                    return summary[:500]
        return None

