# Security Spec: Hyper Jobs Zero-Trust Firestore Security Rule Specifications

This specification establishes the strict relationship invariants, structural assertions, and adversarial test scenarios governing the Hyper Jobs Firestore schema and access permissions.

## 1. Core Data Invariants & Access Schema

| Entity | Primary Collection Path | Write Invariant | Read Restriction |
| :--- | :--- | :--- | :--- |
| **SeekerProfile** | `/users/{userId}` | Only the authenticated user matching `{userId}` can write. Timestamp `request.time` must be respected. | Public profiles are readable, but Private PII is isolated or strictly restricted (Read only by Owner or Admin). |
| **CompanyProfile** | `/companies/{companyId}` | Only the owner/recruiter of that company matching `{companyId}` can write. | Anyone can read public company profiles. |
| **JobPost** | `/jobs/{jobId}` | Only authenticated recruiters can write; the `employerId` in the job payload MUST strictly match `request.auth.uid`. | Anyone can read or search active jobs. |
| **JobApplication** | `/applications/{applicationId}` | Seeker can create with status "Applied" and `seekerId` matching `request.auth.uid`. Recruiter can update status/score/notes. | Seeker (owner of `seekerId`) and Recruiter (owner/creator of the associated job) can read. |
| **ChatSession** | `/chats/{chatId}` | Only are authenticated if `request.auth.uid` is either `seekerId` or `recruiterId`. | Only participating members (seeker or recruiter) can read. |
| **ChatMessage** | `/chats/{chatId}/messages/{messageId}` | Must be a member of the parent ChatSession. Sender ID in message must match `request.auth.uid`. | Only participating chat members can read. |
| **UserNotification** | `/users/{userId}/notifications/{notifId}` | System-generated or owner written only. | Only user matching `{userId}` can read. |

---

## 2. The "Dirty Dozen" Malicious Payloads (Vulnerability Vector Map)

The following 12 payloads are designed to bypass business restrictions, spoof identities, inject toxic values, or shortcut states. Our security rules must reject them with `PERMISSION_DENIED`.

### Attack Vector 1: Identity Spoofing (Owner Takeover)
*   **Target Path**: `/users/legit_user_abc`
*   **Attacker**: Authenticated as `hacker_xyz`
*   **Malicious Payload**:
    ```json
    { "fullName": "Admin Attacker", "email": "legit_user_abc@gmail.com", "bio": "Overwritten by hacker" }
    ```
*   **Reasoning**: Users must not modify profiles other than their own.

### Attack Vector 2: Role / Claim Self-Escalation
*   **Target Path**: `/users/hacker_xyz`
*   **Attacker**: `hacker_xyz`
*   **Malicious Payload**:
    ```json
    { "fullName": "Hacker", "email": "hacker@gmail.com", "isAdmin": true, "role": "admin" }
    ```
*   **Reasoning**: Users trying to inject elevated administrative keys during profile creation.

### Attack Vector 3: Anonymous Job Post (Resource Exhaustion)
*   **Target Path**: `/jobs/malicious_job_1`
*   **Attacker**: Unauthenticated (Anonymous or signed out)
*   **Malicious Payload**:
    ```json
    { "title": "Fake Senior Dev Position", "description": "Spam job", "companyName": "Fake Corp", "employerId": "anon_attacker" }
    ```
*   **Reasoning**: Jobs can only be created by authenticated users whose UID is verified.

### Attack Vector 4: Employer ID Spoofing
*   **Target Path**: `/jobs/legit_job_abc`
*   **Attacker**: Authenticated as `hacker_xyz`
*   **Malicious Payload**:
    ```json
    { "title": "Senior Solutions Architect", "description": "High salary", "companyName": "Stria Studio", "employerId": "innocent_employer_123" }
    ```
*   **Reasoning**: Attacker attempts to post a job on behalf of a legitimate developer recruiter, framing them for fake vacancies.

### Attack Vector 5: State Shortcutting (Self-Promotion) - Status Hijack
*   **Target Path**: `/applications/application_999`
*   **Attacker**: Authenticated Seeker `seeker_init`
*   **Malicious Payload (Update)**:
    ```json
    { "status": "Offered" }
    ```
*   **Reasoning**: Candidate seeker tries to promote their status on the application from "Applied" to "Offered" on their own dashboard. Only recruiters can update application statuses!

### Attack Vector 6: Application Theft (Hijacking other seeker submissions)
*   **Target Path**: `/applications/app_legit_1` (Created by Seeker `emma_davis`)
*   **Attacker**: Authenticated Seeker `attacker_joe`
*   **Malicious Payload (Update)**:
    ```json
    { "coverLetter": "Overwritten cover letter" }
    ```
*   **Reasoning**: Attacker cannot modify or access records they don't own.

### Attack Vector 7: Chat Session Injection (Faking recruiter credentials)
*   **Target Path**: `/chats/chat_secret_1`
*   **Attacker**: Authenticated Seeker `hacker_xyz`
*   **Malicious Payload (Create)**:
    ```json
    { "jobId": "job1", "seekerId": "emma_davis", "recruiterId": "recruiter1" }
    ```
*   **Reasoning**: Attacker tries to inject themselves into a direct chat channel or spoof a dialogue between a recruiter and another seeker.

### Attack Vector 8: Message Injection (Faking recruiter statements)
*   **Target Path**: `/chats/chat_1/messages/msg_999`
*   **Attacker**: Seeker `emma_davis` (Who is a legitimate chat participant, but trying to send message as recruiter)
*   **Malicious Payload (Create)**:
    ```json
    { "chatId": "chat_1", "senderId": "recruiter1", "senderType": "recruiter", "senderName": "Awesome Employer", "text": "You are hired immediately at $200,000 baseline compensation!" }
    ```
*   **Reasoning**: Participant tries to send a chat message with the other person's Identity (spoofing senderId).

### Attack Vector 9: Notification Interception (PII Scraping)
*   **Target Path**: `/users/victim_uid/notifications/notif_1`
*   **Attacker**: Authenticated as `attacker_joe`
*   **Action**: Attempt standard `read` (get/list) of notifications.
*   **Reasoning**: One seeker must not scrape another user's notifications.

### Attack Vector 10: Shadow Field Injection (The "Ghost Field" Attack)
*   **Target Path**: `/jobs/ghost_job`
*   **Attacker**: Authenticated Recruiter `recruiter1`
*   **Malicious Create Payload**:
    ```json
    { "title": "Developer", "companyName": "Tech", "description": "Work here", "employerId": "recruiter1", "isSystemApproved": true, "vipListing": true }
    ```
*   **Reasoning**: Creation payloads must strictly conform to allowed properties; attackers should not inject ghost fields bypassing business pricing or validation models.

### Attack Vector 11: Value Poisoning (Resource Exhaustion / Buffer Overflow)
*   **Target Path**: `/users/seeker_init`
*   **Attacker**: Authenticated Seeker `seeker_init`
*   **Malicious Payload**:
    ```json
    { "fullName": "Emma Davis", "resumeText": "[A giant 5 Megabyte noise string designed to exhaust disk and read quota or crash parser metrics]" }
    ```
*   **Reasoning**: Fields must be bound with strict `.size()` constraints to protect the database against denial-of-wallet resource exhausting attacks.

### Attack Vector 12: Terminal State Locking Bypass
*   **Target Path**: `/applications/app_archived_99` (Where status is terminal "Declined")
*   **Attacker**: Recruiter trying to bypass status flow rules.
*   **Malicious Payload**:
    ```json
    { "status": "Applied" }
    ```
*   **Reasoning**: Once an application reaches a terminal outcome ("Declined", "Offered"), it is frozen and cannot be reverted by clients unless managed by an admin.

---

## 3. Dynamic Spec Validations

The accompanying `firestore.rules` will implement detailed validation predicates (`isValidSeeker` and `isValidCompany`) checking size limits, types, and required schema keys, guaranteeing mathematically that these Dirty Dozen are blocked from the storage layer.
