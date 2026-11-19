# Project Prompts — Resume RAG Application

The kickoff prompts given at the start of each major phase/section of this project,
captured verbatim for reference. (IDE "file opened" context lines and simple
"approved" replies are omitted — only the substantive instruction prompts are listed.)

---

## 1. Resume Ingestion

> Refer the attached architecture implementation file and implement it phase by phase, in order.
>
> **[STRICT]** Implement ONE phase at a time. After finishing a phase, STOP. Do not start the next phase until I explicitly type "approved".
> **[STRICT]** Stay strictly within the architecture. Do not hallucinate, do not add anything outside the MD file, do not skip any context from it.
> **[STRICT]** Keep ingestion and retrieval in the SAME Node + TypeScript + Express codebase, same MongoDB, same server (npm run dev). Do not create a second backend. Leave src/modules/retrieval empty until all ingestion phases are done.
>
> After each phase:
> 1. Confirm the server starts with npm run dev and has no TypeScript errors.
> 2. If the phase exposes an endpoint, give me the exact Postman request (method, URL, headers, body type, body) and the expected response body, exactly as defined in the architecture.
> 3. If the phase has no endpoint of its own, say so instead of inventing one, and tell me exactly how to verify it (unit test, log output, or re-testing an existing endpoint).
> 4. Then wait for my "approved" before moving on.
>
> Response expectations: use the exact status codes and error codes given in the architecture. Do not force every case to return 200. Error paths such as INVALID_FILE_TYPE (415), FILE_TOO_LARGE (413), RESUME_EXTRACTION_FAILED (422) and LLM_PARSER_DISABLED must behave as specified.
>
> I will test in Postman. Once the response matches what the architecture expects and I approve, continue to the next phase.
>
> If you hit an error, show me the full error and the fix, then confirm the server is running again before continuing.

*Reference file: `01_Resume_Ingestion_Phasewise_Implementation 2.md`*

---

## 2. Bulk Resume Ingestion (Phase 17)

**Prompt 2a — the requirement:**

> Next steps:
>
> 1. Add the resume folder containing the resume files to the existing workspace. — path for this = "D:\GenAI\phase2\week9\Resumes"
> 2. Write a prompt to implement a batch ingestion workflow for resumes and share with me for review.
> 3. Configure the workflow to process resumes in batches of 5 or 10 files per run.
> 4. Validate the ingestion process by testing multiple batches and verifying that all resumes are successfully ingested.
>
> Before doing this, up the server for both front end and back end, do the API health checks and then proceed with aforementioned steps

**Prompt 2b — turn it into a reusable MD + widen file types:**

> can you create a new md file with this prompt, name it as "phase17_bulkResumeIngestion.md", also include "doc" & "docx" type resumes to be allowed, and then refer that "phase17_bulkResumeIngestion.md" as your reference for next implementation

*Reference file: `phase17_bulkResumeIngestion.md`*

---

## 3. Resume Retrieval

> Move on to next phase since all the documents already stored in the mongodb.
> Implement the retrieval phase by phase by referring this file - "02_Resume_Retrieval_Phasewise_Implementation.md" file. One phase at a time.
> Once one phase is completed, proceed to next phase. After each phase completion i am expecting Request body, API endpoint and response body to validate in postman.
>
> **[STRICT]** DO NOT HALLUCINATE AND DO NOT GO BEYOND THE SCOPE
> **[MANDATORY]** DO NOT PROCEED TO NEXT PHASE UNTIL I APPROVE.

*Reference file: `02_Resume_Retrieval_Phasewise_Implementation.md`*

---

## 4. Frontend Web Application

> So far we have completed the ingestion & retrieval and documents stored already in the mongoDB as well.
> Implement the front end phase by phase by referring this file - "FRONTEND_WEB_INSTRUCTIONS_FINAL_V2_PHASE_VISIBLE.md" file under "md" folder. One phase at a time.
> Once one phase is completed, proceed to next phase. Review the md file and let me know if there are any constraints, else proceed with implementation.
>
> **[STRICT]** DO NOT HALLUCINATE AND DO NOT GO BEYOND THE SCOPE
> **[MANDATORY]** DO NOT PROCEED TO NEXT PHASE UNTIL I APPROVE.
>
> Note: After each phase, do the validations in UI and fix the errors if any. Also, validate API endpoints with respect to each phase wherever relevant, and if new endpoints are created means, do notify me so that I can check them in postman from my end.

*Reference file: `FRONTEND_WEB_INSTRUCTIONS_FINAL_V2_PHASE_VISIBLE.md`*

---

## 5. Frontend Enhancement — Organization Branding (NatWest Group)

> Enhance the existing Resume RAG application by implementing the following features:
>
> - Re-ranking of retrieved resumes
> - Deduplication of repeated results
> - Summarization of the final results
> - Complete end-to-end pipeline integration
> - Display all relevant results clearly on the UI
>
> Customize the application based on organization's branding which is NatWest Group in this case, including:
>
> - Organization name and logo
> - Brand theme and colours
> - Professional UI layout
> - Responsive design
> - Loading, success, validation, and error messages
> - Any other relevant organization-specific enhancements
>
> After completing the implementation, test the complete end-to-end application. Let me know if you have any additional queries so that I can answer now itself as I will be away for a while

