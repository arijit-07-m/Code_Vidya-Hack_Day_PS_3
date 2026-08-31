# Demo Walkthrough

## Step-by-step Hackathon Demo

### Prerequisites
- Firebase project configured
- Gemini or OpenAI API key set in `.env`
- Backend running on port 3001
- Web app running on port 3000

### Demo Steps

**Step 1: Sign Up**
1. Open `http://localhost:3000`
2. Click "Create account"
3. Enter name, email, and password
4. Submit

**Step 2: Create Club**
1. Click "Create Club"
2. Enter club name: "Code Vidhya Club"
3. Add description and category
4. Submit → You become the OWNER automatically

**Step 3: Create Event**
1. Go to Events
2. Click "+ New Event"
3. Enter: "Code Vidhya Hack Day", date: "2026-09-01"
4. Venue: "Senate Hall", Expected: 500
5. Submit

**Step 4: Dashboard**
1. View the dashboard showing 0% completion, 0 tasks, 0 risks
2. Note the greeting and club name

**Step 5: Add Meeting & Analyze**
1. Go to Meetings
2. Create a new meeting with the demo transcript:
   ```
   Rahul will arrange the projector before tomorrow. Priya will prepare the participant certificates by tonight. Aman needs to contact all speakers and confirm their arrival. Sneha will publish the Instagram announcement. We still haven't confirmed the backup venue. Rahul is also handling registration.
   ```
3. Click "Analyze Meeting" (AI processing)
4. AI extracts action items:
   - ☐ Arrange projector — Rahul (by tomorrow)
   - ☐ Prepare certificates — Priya (by tonight)
   - ☐ Contact speakers — Aman (no deadline)
   - ☐ Create Instagram post — Sneha (no deadline)
5. Human reviews and approves selected items

**Step 6: Tasks Created**
1. Go to Tasks
2. See the approved tasks with correct priorities
3. Filter by status, priority

**Step 7: Risk Detection**
1. Go to Risks or trigger risk analysis
2. AI identifies: "Backup venue not confirmed"
3. Shows explanation and recommendation

**Step 8: AI Assistant**
1. Go to AI Assistant
2. Type: "Create a high priority task for Aman to confirm the backup venue by tonight"
3. AI Agent detects intent → creates task

**Step 9: Android App**
1. Open the Android app (Expo)
2. Sign in with same credentials
3. View "My Tasks" showing all assigned tasks
4. Task list refreshes with real-time data

**Step 10: Complete Task from Android**
1. On Android, mark a task as completed
2. Return to web dashboard
3. Task status updates automatically (Firestore real-time)

### Demo Script Notes

- Emphasize the **multi-club security** (Club A cannot see Club B)
- Show **role-based access** (Owner vs Volunteer UI)
- Highlight the **Human-in-the-loop** workflow (AI suggests → human approves)
- Demonstrate the **AI Operations Brief** on dashboard