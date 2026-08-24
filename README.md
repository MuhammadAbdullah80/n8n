# n8n
My work on n8n

to see what Class 1 workflows do got to 
HomeTasks/Assesment 1.


## Workflows

Each JSON file at the repo root is an n8n workflow export. Import via
**Workflows -> Import from File**.

| File | What it does | Trigger |
|------|--------------|---------|
| `Customer_Support_Workflow.json` | Routes inbound support mail, classifies intent, drafts a reply | Email |
| `Invoice_Workflow.json` | Extracts invoice fields and files them | Email / upload |
| `RAG_Pipeline_and_Chatbot.json` | Embeds documents and answers questions over them | Chat |
| `LinkedIn_Content_creator_Workflow.json` | Drafts LinkedIn posts from a topic | Manual |
| `Prompt Generator.json` | Expands a short brief into a structured prompt | Manual |
| `Spam Email.json` | Classifies inbound mail as spam | Email |
| `FAS Emails.json` | Handles FAS-specific mail routing | Email |
| `Classroom.json` | Classroom automation tasks | Scheduled |
| `n8n-Backup.json`, `n8n-Workflows-Backup.json` | Export workflows on a schedule | Scheduled |
| `n8n-Credentials-Backup.json` | Export credentials on a schedule | Scheduled |
| `n8n-Workflow-Retrieval.json`, `n8n-Credentials-Retrieval.json` | Restore from a backup | Manual |
| `Class *-HomeTask *.json` | Coursework exercises | Manual |

### Before importing

These exports carry credential and webhook IDs from the instance they were
taken on, so imported nodes will need their credentials reselected. See #6.

## Custom nodes

TypeScript sources live in `nodes/`. See [nodes/README.md](nodes/README.md).
