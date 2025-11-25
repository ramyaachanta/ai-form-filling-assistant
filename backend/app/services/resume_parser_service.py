import os
import re
import asyncio
from typing import Dict, Any, Optional
from pathlib import Path
import pdfplumber
from docx import Document


class ResumeParserService:
    
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
        
        extracted_data = {
            "name": ResumeParserService._extract_name(text),
            "email": ResumeParserService._extract_email(text),
            "phone": ResumeParserService._extract_phone(text),
            "address": ResumeParserService._extract_address(text),
            "skills": ResumeParserService._extract_skills(text),
            "experience": ResumeParserService._extract_experience(text),
            "education": ResumeParserService._extract_education(text),
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

