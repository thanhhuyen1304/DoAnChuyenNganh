# TODO: Enable Chatbot Access to Personal Information

## Overview
Integrate personalizedPlanService into the chat system to allow chatbot access to personal information like favoriteLanguages, submission history, and personalized recommendations.

## Tasks
- [ ] Modify keywordExtractionService.ts to include personalized recommendations from personalizedPlanService
- [ ] Update chat.controller.ts to pass personalized data to AI responses
- [ ] Ensure chatbot can access and utilize user profile information
- [ ] Test the integration to verify personal information access

## Files to Edit
- server/src/services/keywordExtractionService.ts
- server/src/controllers/chat.controller.ts

## Expected Outcome
Chatbot will have access to:
- User's favoriteLanguages
- Submission history and performance data
- Personalized challenge and training data recommendations
- User profile information for better context-aware responses
