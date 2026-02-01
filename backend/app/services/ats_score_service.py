import re
import json
import asyncio
from typing import Dict, Any, Optional
from collections import Counter
from bs4 import BeautifulSoup
from openai import OpenAI
from app.config import settings
from app.services.html_parser_service import HTMLParserService
from app.services.resume_parser_service import ResumeParserService


class ATSScoreService:
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.openai_api_key)
    
    @staticmethod
    async def calculate_ats_score(job_url: str, resume_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate ATS score by comparing resume with job posting
        Returns score from 0-100 and recommendation
        """
        try:
            # Extract job description from URL
            html_parser = HTMLParserService()
            job_description = ""
            try:
                # Get page content to extract job description
                html_content = await html_parser.fetch_html(job_url)
                
                # Extract job description text
                job_description = ATSScoreService._extract_job_description(html_content)
                
                if not job_description or len(job_description) < 100:
                    # Fallback: try to get text from form analysis
                    try:
                        analysis = await html_parser.analyze_form_from_url(job_url)
                        job_description = analysis.get('full_text', '') or ''
                    except:
                        pass
                
            except Exception as e:
                # Try fallback: get text from form analysis
                try:
                    analysis = await html_parser.analyze_form_from_url(job_url)
                    job_description = analysis.get('full_text', '') or ''
                except:
                    job_description = ""
            finally:
                await html_parser.close()
            
            if not job_description:
                return {
                    "score": 0,
                    "recommendation": "unknown",
                    "message": "Could not extract job description. Proceeding with form analysis.",
                    "details": {}
                }
            
            # Use GPT to calculate ATS score
            ats_service = ATSScoreService()
            try:
                gpt_result = await ats_service._calculate_ats_score_with_gpt(resume_data, job_description)
                return gpt_result
            except Exception as e:
                # Fallback to rule-based if GPT fails
                return await ats_service._fallback_calculate_score(resume_data, job_description)
        except Exception as e:
            return {
                "score": 0,
                "recommendation": "unknown",
                "message": f"Error calculating ATS score: {str(e)}",
                "details": {}
            }
    
    @staticmethod
    def _extract_job_description(html: str) -> str:
        """Extract job description text from HTML"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Try to find job description in common sections
            job_desc_selectors = [
                'div[class*="description"]',
                'div[class*="job-description"]',
                'div[class*="requirements"]',
                'div[class*="qualifications"]',
                'section[class*="description"]',
                'div[class*="content"]',
                'article',
                'main'
            ]
            
            for selector in job_desc_selectors:
                elements = soup.select(selector)
                if elements:
                    text = ' '.join([elem.get_text(separator=' ', strip=True) for elem in elements])
                    if len(text) > 200:  # Likely job description if substantial text
                        return text
            
            # Fallback: get all text
            text = soup.get_text(separator=' ', strip=True)
            return text[:5000]  # Limit to first 5000 chars
        except Exception:
            # Fallback: simple text extraction
            import re
            text = re.sub(r'<[^>]+>', ' ', html)
            text = re.sub(r'\s+', ' ', text)
            return text[:5000]
    
    async def _calculate_ats_score_with_gpt(self, resume_data: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """Use GPT to analyze resume against job description and calculate ATS score"""
        
        # Prepare resume summary
        resume_summary = f"""
RESUME INFORMATION:
- Name: {resume_data.get('name', 'N/A')}
- Email: {resume_data.get('email', 'N/A')}
- Phone: {resume_data.get('phone', 'N/A')}
- Location: {resume_data.get('location', 'N/A')}

SKILLS:
{', '.join(resume_data.get('skills', [])) if resume_data.get('skills') else 'Not specified'}

EDUCATION:
"""
        
        # Add structured education
        structured_edu = resume_data.get('structured_education', [])
        if structured_edu:
            for edu in structured_edu:
                resume_summary += f"- {edu.get('degree', '')} in {edu.get('discipline', '')} from {edu.get('school', '')} ({edu.get('start_date', '')} - {edu.get('end_date', '')})\n"
        else:
            resume_summary += f"{resume_data.get('education', 'Not specified')}\n"
        
        resume_summary += "\nEXPERIENCE:\n"
        
        # Add structured employment
        structured_emp = resume_data.get('structured_employment', [])
        if structured_emp:
            for emp in structured_emp:
                current = " (Current)" if emp.get('current', False) else ""
                resume_summary += f"- {emp.get('title', '')} at {emp.get('company', '')} ({emp.get('start_date', '')} - {emp.get('end_date', '')}){current}\n"
        else:
            resume_summary += f"{resume_data.get('experience', 'Not specified')}\n"
        
        # Add online profiles
        online_profiles = resume_data.get('online_profiles', {})
        if online_profiles:
            resume_summary += "\nONLINE PROFILES:\n"
            for platform, url in online_profiles.items():
                if url:
                    resume_summary += f"- {platform}: {url}\n"
        
        # Add summary if available
        if resume_data.get('summary'):
            resume_summary += f"\nSUMMARY:\n{resume_data.get('summary')}\n"
        
        # Add full text for context
        if resume_data.get('full_text'):
            resume_summary += f"\nFULL RESUME TEXT:\n{resume_data.get('full_text')[:2000]}\n"
        
        prompt = f"""You are an expert ATS (Applicant Tracking System) analyst. Analyze the candidate's resume against the job description and provide detailed breakdown scores.

JOB DESCRIPTION:
{job_description[:4000]}

CANDIDATE RESUME:
{resume_summary[:4000]}

Please analyze the resume against the job description and provide a detailed assessment. For each category, assign a score from 0-100:

1. Skills Match (0-100): How well do the candidate's skills align with required/mentioned skills in the job description?
   - 90-100: All or nearly all required skills present
   - 70-89: Most required skills present, some gaps
   - 50-69: Some required skills present, significant gaps
   - 30-49: Few required skills present
   - 0-29: Very few or no required skills present

2. Experience Match (0-100): Does the candidate have relevant work experience?
   - 90-100: Extensive relevant experience, exceeds requirements
   - 70-89: Strong relevant experience, meets or exceeds requirements
   - 50-69: Some relevant experience, partially meets requirements
   - 30-49: Limited relevant experience, may not meet requirements
   - 0-29: Little to no relevant experience

3. Education Match (0-100): Does the candidate meet educational requirements?
   - 100: Meets or exceeds all educational requirements
   - 70-99: Mostly meets requirements (e.g., similar degree, different field)
   - 50-69: Partially meets (e.g., lower degree level but relevant)
   - 30-49: Does not meet but has some relevant education
   - 0-29: Does not meet educational requirements

4. Keywords Match (0-100): How many important keywords/phrases from the job description appear in the resume?
   - 90-100: Most important keywords present
   - 70-89: Many important keywords present
   - 50-69: Some important keywords present
   - 30-49: Few important keywords present
   - 0-29: Very few or no important keywords present

Return a JSON response with the following structure:
{{
    "score": <integer 0-100, your overall ATS compatibility assessment>,
    "recommendation": "<high|medium|low|poor>",
    "message": "<a detailed message explaining the assessment>",
    "details": {{
        "skills_match": <integer 0-100, be specific and accurate>,
        "experience_match": <integer 0-100, be specific and accurate>,
        "education_match": <integer 0-100, be specific and accurate>,
        "keywords_match": <integer 0-100, be specific and accurate>,
        "strengths": ["<strength1>", "<strength2>", ...],
        "weaknesses": ["<weakness1>", "<weakness2>", ...],
        "suggestions": ["<suggestion1>", "<suggestion2>", ...]
    }}
}}

Important: Provide your overall score assessment (0-100) based on your holistic evaluation. The breakdown scores should align with your overall assessment.

Be thorough, accurate, and provide actionable feedback. Return ONLY valid JSON, no additional text."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert ATS analyst. Always return valid JSON responses."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=2000,
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            result = json.loads(content)
            
            # Ensure details have all required fields
            if 'details' not in result:
                result['details'] = {}
            
            details = result['details']
            for key in ['skills_match', 'experience_match', 'education_match', 'keywords_match']:
                if key not in details:
                    details[key] = 0
                else:
                    # Ensure each breakdown score is 0-100
                    details[key] = max(0, min(100, int(details[key])))
            
            # Use GPT's overall score as primary (more accurate holistic assessment)
            gpt_score = result.get('score', None)
            
            if gpt_score is not None:
                # Use GPT's score directly (it's more accurate)
                score = max(0, min(100, int(gpt_score)))
            else:
                # Fallback: Calculate from breakdown scores if GPT didn't provide overall score
                # Weights: Skills (40%), Keywords (30%), Experience (15%), Education (15%)
                skills_score = details.get('skills_match', 0)
                keywords_score = details.get('keywords_match', 0)
                experience_score = details.get('experience_match', 0)
                education_score = details.get('education_match', 0)
                
                score = int(
                    skills_score * 0.40 +
                    keywords_score * 0.30 +
                    experience_score * 0.15 +
                    education_score * 0.15
                )
            
            result['score'] = score
            
            # Determine recommendation from calculated score
            if score >= 70:
                recommendation = 'high'
                message = f"Excellent match! Your resume scores {score}% for this position. Proceed with confidence."
            elif score >= 50:
                recommendation = 'medium'
                message = f"Good match. Your resume scores {score}% for this position. Consider applying."
            elif score >= 30:
                recommendation = 'low'
                message = f"Moderate match. Your resume scores {score}% for this position. You may want to tailor your resume."
            else:
                recommendation = 'poor'
                message = f"Low match. Your resume scores {score}% for this position. Consider updating your resume for better results."
            
            result['recommendation'] = recommendation
            # Update message if GPT didn't provide a good one
            if not result.get('message') or len(result.get('message', '')) < 20:
                result['message'] = message
            
            return result
            
        except json.JSONDecodeError as e:
            # Fallback to rule-based calculation if GPT fails
            return await self._fallback_calculate_score(resume_data, job_description)
        except Exception as e:
            # Fallback to rule-based calculation if GPT fails
            return await self._fallback_calculate_score(resume_data, job_description)
    
    async def _fallback_calculate_score(self, resume_data: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """Fallback rule-based calculation if GPT fails"""
        score_details = ATSScoreService._calculate_match_score(resume_data, job_description)
        total_score = score_details.get('total_score', 0)
        
        if total_score >= 70:
            recommendation = "high"
            message = f"Excellent match! Your resume scores {total_score}% for this position. Proceed with confidence."
        elif total_score >= 50:
            recommendation = "medium"
            message = f"Good match. Your resume scores {total_score}% for this position. Consider applying."
        elif total_score >= 30:
            recommendation = "low"
            message = f"Moderate match. Your resume scores {total_score}% for this position. You may want to tailor your resume."
        else:
            recommendation = "poor"
            message = f"Low match. Your resume scores {total_score}% for this position. Consider updating your resume for better results."
        
        return {
            "score": total_score,
            "recommendation": recommendation,
            "message": message,
            "details": score_details
        }
    
    @staticmethod
    def _calculate_match_score(resume_data: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """Calculate matching score between resume and job description"""
        job_lower = job_description.lower()
        resume_text = resume_data.get('full_text', '').lower()
        
        scores = {
            "skills_match": 0,
            "experience_match": 0,
            "education_match": 0,
            "keywords_match": 0,
            "total_score": 0
        }
        
        # Skills matching (40% weight)
        resume_skills = resume_data.get('skills', [])
        if resume_skills:
            skills_found = 0
            for skill in resume_skills:
                skill_lower = skill.lower()
                # Check if skill appears in job description
                if skill_lower in job_lower or any(word in job_lower for word in skill_lower.split() if len(word) > 3):
                    skills_found += 1
            scores["skills_match"] = min(100, (skills_found / len(resume_skills)) * 100) if resume_skills else 0
        
        # Experience/Keywords matching (30% weight)
        # Extract important keywords from job description
        job_keywords = ATSScoreService._extract_keywords(job_description)
        resume_keywords = ATSScoreService._extract_keywords(resume_text)
        
        if job_keywords:
            matched_keywords = set(job_keywords) & set(resume_keywords)
            scores["keywords_match"] = min(100, (len(matched_keywords) / len(job_keywords)) * 100)
        
        # Education matching (15% weight)
        # Check for degree requirements
        degree_keywords = ['bachelor', 'master', 'phd', 'doctorate', 'degree', 'diploma']
        job_has_degree_req = any(keyword in job_lower for keyword in degree_keywords)
        resume_has_education = bool(resume_data.get('education') or resume_data.get('structured_education'))
        
        if job_has_degree_req and resume_has_education:
            scores["education_match"] = 100
        elif not job_has_degree_req:
            scores["education_match"] = 100  # No requirement, so it's a match
        else:
            scores["education_match"] = 0
        
        # Experience level matching (15% weight)
        experience_years_patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)',
            r'(?:experience|exp)[:\s]*(\d+)\+?\s*years?'
        ]
        
        job_years_required = 0
        for pattern in experience_years_patterns:
            match = re.search(pattern, job_lower)
            if match:
                job_years_required = int(match.group(1))
                break
        
        if job_years_required > 0:
            # Estimate experience from resume
            resume_experience = resume_data.get('structured_employment', [])
            estimated_years = len(resume_experience) * 2  # Rough estimate: 2 years per job
            if estimated_years >= job_years_required:
                scores["experience_match"] = 100
            else:
                scores["experience_match"] = min(100, (estimated_years / job_years_required) * 100)
        else:
            scores["experience_match"] = 100  # No requirement specified
        
        # Calculate weighted total score
        scores["total_score"] = int(
            scores["skills_match"] * 0.40 +
            scores["keywords_match"] * 0.30 +
            scores["education_match"] * 0.15 +
            scores["experience_match"] * 0.15
        )
        
        return scores
    
    @staticmethod
    def _extract_keywords(text: str, min_length: int = 4) -> list:
        """Extract important keywords from text"""
        # Common stop words to exclude
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
            'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
            'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all',
            'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
            'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'just'
        }
        
        # Extract words
        words = re.findall(r'\b[a-z]{' + str(min_length) + r',}\b', text.lower())
        
        # Filter out stop words and get unique words
        keywords = [word for word in words if word not in stop_words and len(word) >= min_length]
        
        # Count frequency and return top keywords
        word_freq = Counter(keywords)
        # Return top 50 keywords
        return [word for word, count in word_freq.most_common(50)]
