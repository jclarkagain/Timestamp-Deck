# Penetration Testing Proposal and Statement of Work Template

**Document status:** Template for adaptation  
**Prepared by:** Manus AI  
**Version:** 1.0  
**Date:** [Month Day, Year]  
**Client:** [Client legal name]  
**Service Provider:** [Provider legal name]  
**Engagement reference:** [SOW / project number]

> **Important notice.** This template is an operational and commercial starting point, not legal advice. It should be completed for the specific engagement, reviewed by qualified legal counsel, and executed by authorized representatives before testing begins. The SOW must be read together with the governing master services agreement (“MSA”), purchase order, or equivalent agreement. If there is a conflict, state which document controls.

This template is designed for **authorized security testing only**. NIST defines rules of engagement as detailed guidelines and constraints established before a security test that give a testing team authority to perform defined activities.[1] The scope and controls below therefore should be specific enough to protect people, systems, data, and third parties while enabling useful validation.

---

## 1. Proposal cover letter

[Client contact name]:

[Provider legal name] is pleased to propose the authorized penetration-testing services described in this Statement of Work (“SOW”). The engagement is intended to identify and validate security weaknesses in the approved environment, communicate their business and technical impact, and provide practical remediation guidance. The parties acknowledge that security testing can affect system availability or expose sensitive information if not carefully controlled. Accordingly, all activities will be conducted only within the written scope, time window, authorization, and safety limitations set out in this SOW and its Rules of Engagement (“RoE”).

This proposal is valid until **[date]**. Upon acceptance, this SOW will be governed by **[name and date of MSA or other governing agreement]**.

| Proposal item | Value |
|---|---|
| Proposed service | [External network / internal network / web application / API / wireless / cloud configuration / other] penetration test |
| Proposed commencement | [Date] |
| Proposed completion | [Date] |
| Fixed fee or time and materials | [Amount and currency / rate card reference] |
| Primary client sponsor | [Name, title, email, telephone] |
| Primary provider lead | [Name, title, email, telephone] |

---

# Statement of Work

## 2. Parties, purpose, and precedence

This SOW is entered into by and between **[Client legal name]**, with its principal place of business at **[address]** (“Client”), and **[Provider legal name]**, with its principal place of business at **[address]** (“Provider”). The Client represents that it owns, controls, or has obtained all necessary authority to authorize testing of the in-scope assets and environments.

The purpose of this engagement is to conduct an authorized security assessment of the in-scope assets identified in **Appendix A**. The assessment will be designed to identify, safely validate, and report material security weaknesses. Unless explicitly approved in this SOW or in a signed change order, no activity may be interpreted as authorization to access, test, alter, impair, or obtain data from any other asset, account, person, or third party.

The parties should identify the order of precedence here:

| Order of precedence | Governing document |
|---|---|
| 1 | [Master Services Agreement, date] |
| 2 | This Statement of Work, including signed appendices and change orders |
| 3 | [Client purchase order, if applicable] |
| 4 | [Other agreed document] |

## 3. Objectives and success criteria

The engagement objectives are as follows: **[describe the business and security objectives, such as validating exposure of an internet-facing application, assessing segmentation, or evaluating remediation of prior findings]**. The Provider will use reasonable professional judgment to select test activities that are appropriate to those objectives and the approved scope.

The parties agree that a finding is considered **verified** when the Provider has obtained sufficient, minimally invasive evidence that the weakness exists in an in-scope asset. A successful engagement does not certify that the environment is free of vulnerabilities, and the testing results represent conditions observed during the stated assessment period.

| Objective | Measurement or acceptance criterion | Client owner |
|---|---|---|
| [Objective 1] | [Example: All in-scope external applications assessed during the approved window] | [Name/role] |
| [Objective 2] | [Example: Verified findings include evidence, impact, and remediation guidance] | [Name/role] |
| [Objective 3] | [Example: Critical findings are notified within the agreed threshold] | [Name/role] |

## 4. Scope of services

The Provider will perform the following approved services:

| Test area | Included activities | Excluded activities or conditions |
|---|---|---|
| [External network] | [Discovery, service enumeration, vulnerability validation within Appendix A ranges] | [Assets not listed; high-volume testing; availability testing unless explicitly authorized] |
| [Web application / API] | [Authentication, session, authorization, input handling, configuration, and business-logic testing] | [Production data extraction beyond minimum proof; third-party endpoints not listed] |
| [Internal environment] | [Assessment of approved hosts and paths from the designated test segment] | [Unapproved lateral movement or domains] |
| [Cloud environment] | [Configuration and identity review of named subscriptions/accounts] | [Resources owned by unapproved tenants] |
| [Other] | [Describe] | [Describe] |

The exact assets, interfaces, IP ranges, domains, cloud accounts, environments, and authorized test accounts are listed in **Appendix A: Asset and Scope Register**. Appendix A is the sole source of truth for technical scope. The Client will provide a current register before testing begins and will promptly notify the Provider of changes.

For web and API engagements, the parties may map testing to the OWASP Web Security Testing Guide, which provides a framework of web-application and web-service testing practices.[2] Any methodology reference is informational and does not expand authorized scope.

## 5. Rules of engagement and authorization

The following terms constitute the RoE for this engagement. NIST’s technical testing guidance addresses planning, testing, analysis, and mitigation activities; the detailed RoE below converts those principles into engagement-specific operational controls.[3]

### 5.1 Authorization

The Client authorizes the Provider and the named personnel in **Appendix D** to perform the approved activities against the assets in Appendix A during the approved testing window. The Client will obtain and maintain authorization from all relevant asset owners, hosting providers, managed-service providers, cloud providers, and other third parties before testing begins.

| Authorization control | Agreed value |
|---|---|
| Authorized testing window and time zone | [Start date/time] to [End date/time, time zone] |
| Approved provider source IP addresses | [IP addresses / VPN egresses] |
| Authorized test accounts and access level | [Reference secured annex or vault location; do not place passwords in this SOW] |
| Authorized Provider personnel | [Names or role-based list] |
| Client executive sponsor | [Name, title, contact information] |
| Client technical authorization contact | [Name, title, contact information] |

### 5.2 Permitted activities

The Provider may perform only the following activities, subject to stated constraints: **[list permitted activities—e.g., non-disruptive discovery, authenticated testing, vulnerability validation, controlled privilege-path validation, configuration review, approved social engineering, or approved wireless testing]**.

Testing must use the least invasive method reasonably sufficient to validate a weakness. The Provider will stop further validation when the agreed proof threshold is reached or if a material risk to confidentiality, integrity, availability, safety, or legal compliance becomes apparent.

### 5.3 Prohibited and restricted activities

Unless separately and expressly authorized in a written change order, the following activities are prohibited: denial-of-service, load or stress testing; destructive changes; removal or alteration of production data; persistence; deployment of malware or destructive payloads; ransom simulation; unapproved phishing, SMS, voice, or physical testing; access to out-of-scope systems; and continued exploitation after the minimum proof threshold is met.

The following restrictions apply: **[e.g., no tests during finance close; no interaction with life-safety systems; no collection of regulated data; no scanning of third-party SaaS beyond named endpoints; rate limits; prohibited user populations]**.

### 5.4 Safety controls, stop conditions, and emergency actions

The Client will maintain appropriate backups, monitoring, and rollback capability for production systems. The Provider will throttle activity, observe agreed rate limits, and cease testing immediately upon any stop condition.

| Condition | Required action | Notification target | Timeframe |
|---|---|---|---|
| Suspected service instability, data exposure, or unanticipated impact | Stop affected activity; preserve minimal evidence; await direction | [Emergency contact] | Immediately |
| Verified critical vulnerability | Suspend further exploitation unless directed; preserve evidence | [Security lead and sponsor] | Within [e.g., 4] hours |
| Suspected active compromise unrelated to testing | Stop potentially confounding activity and follow incident process | [Incident-response contact] | Immediately |
| Scope ambiguity | Pause affected activity pending written confirmation | [Client technical lead] | Before continuing |

## 6. Roles and responsibilities

The Client is responsible for providing timely access, accurate scope information, appropriate authorization, test accounts, required allowlisting, and contact availability. The Provider is responsible for using qualified personnel, observing this SOW and RoE, protecting Client information, promptly communicating material issues, and producing the agreed deliverables.

| Role | Organization | Named individual | Responsibilities |
|---|---|---|---|
| Executive sponsor | Client | [Name] | Approves scope, accepts risk decisions, resolves escalations. |
| Technical lead | Client | [Name] | Coordinates access, confirms assets, receives operational notices. |
| Incident-response contact | Client | [Name] | Makes immediate decisions regarding suspected impact or active compromise. |
| Engagement manager | Provider | [Name] | Coordinates schedule, status, scope changes, and deliverables. |
| Test lead | Provider | [Name] | Directs testing, safety controls, evidence collection, and notifications. |
| Legal/privacy contact | Client / Provider | [Name] | Advises on data handling and contract obligations. |

## 7. Methodology and testing approach

The Provider will use a documented, risk-based testing approach appropriate to the authorized scope. Typical phases include preparation and reconnaissance; discovery and enumeration; vulnerability analysis; safe validation; evidence review; risk analysis; reporting; and, if purchased, remediation retesting. The Provider may use commercially available, open-source, or internally developed testing tools, provided their use remains within this SOW.

The Provider will not represent that all vulnerabilities can be discovered, that all findings can be exploited, or that the testing is a substitute for continuous security controls. Automated results will be reviewed and contextualized before they are reported as verified findings.

## 8. Data handling, confidentiality, and evidence

The Provider will collect only the minimum information reasonably necessary to verify and report a finding. Credentials, secrets, personal data, regulated data, source code, system logs, screenshots, and proof artifacts will be treated as **[confidential / restricted]** information and handled in accordance with the governing agreement and this section.

| Data-handling element | Agreement |
|---|---|
| Approved storage location | [Encrypted Provider system / Client repository / other] |
| Encryption standard or requirement | [Describe] |
| Access limitation | [Named engagement personnel only / role-based controls] |
| Evidence retention period | [e.g., 90 days after final acceptance] |
| Secure deletion method | [Describe or reference policy] |
| Cross-border or residency restriction | [Describe] |
| Handling of credentials | [Secure vault; redact from reports; revoke after use] |
| Sensitive-data proof threshold | [Metadata or redacted proof only, unless approved otherwise] |

The Provider will not knowingly retain or distribute raw sensitive data beyond the agreed retention period. Reports and supporting artifacts will redact credentials, personal data, tokens, and unnecessary system details unless the Client specifically directs otherwise in writing and such handling is permitted by applicable law and agreement.

## 9. Communications, status, and escalation

The Provider will provide **[daily / weekly / other]** status updates that describe progress, blockers, safety concerns, scope questions, and preliminary findings at an appropriate level of detail. Critical and high-severity findings will be communicated outside the normal reporting cadence according to Section 5.4.

| Communication | Method | Recipients | Cadence / trigger |
|---|---|---|---|
| Kickoff | [Video / in person] | [Names] | Before testing |
| Routine status | [Email / secure portal] | [Names] | [Frequency] |
| Critical alert | [Telephone plus secure written summary] | [Names] | Per Section 5.4 |
| Draft report review | [Secure delivery / meeting] | [Names] | [Date or period] |
| Closeout | [Meeting] | [Names] | Within [period] of final report |

## 10. Deliverables and acceptance

The Provider will deliver the following materials through **[secure portal / encrypted transfer / Client repository]**.

| Deliverable | Content | Target delivery | Acceptance criterion |
|---|---|---|---|
| Engagement kickoff record | Confirmed scope, contacts, schedule, and RoE | [Date] | Client confirms material facts are correct. |
| Critical finding notification(s) | Severity, affected asset, evidence summary, immediate action | As triggered | Delivered to designated contacts. |
| Draft penetration-test report | Executive summary, scope, methodology, verified findings, risk ratings, remediation guidance, limitations | [Date] | Client review comments received within [x] business days. |
| Final penetration-test report | Revised report and finding summary | [Date] | Delivered in agreed format; factual corrections incorporated. |
| Retest report, if included | Validation of agreed remediated findings | [Date] | Lists verified remediated, partially remediated, and unremediated items. |
| Evidence package, if included | Sanitized supporting artifacts indexed to findings | [Date] | Meets the data-handling controls in Section 8. |

The report will distinguish verified findings from observations, assumptions, and limitations. Risk ratings will use **[CVSS version / Client risk matrix / other method]**, supplemented by relevant business impact and exposure context. The Client’s acceptance of a deliverable confirms receipt and conformity with this SOW; it does not constitute a guarantee that all vulnerabilities were identified.

## 11. Schedule, dependencies, and change control

| Milestone | Planned date | Dependency | Owner |
|---|---|---|---|
| SOW and RoE executed | [Date] | Legal/procurement approval | [Client / Provider] |
| Scope register and authorizations delivered | [Date] | Appendix A completion | Client |
| Access and test accounts validated | [Date] | Client provisioning | Both |
| Testing window | [Date range] | Operational readiness | Provider |
| Draft report | [Date] | Completion of testing | Provider |
| Client review | [Date range] | Draft delivery | Client |
| Final report | [Date] | Comment resolution | Provider |
| Retest, if applicable | [Date range] | Client remediation | Both |

Any material change to scope, testing method, timeline, fee, authorized personnel, data-handling requirement, or RoE must be recorded in a written change order signed by authorized representatives. Verbal approval is not sufficient for expanding scope or authorizing restricted activity.

## 12. Fees, expenses, and invoicing

| Fee component | Amount / rate | Billing trigger |
|---|---:|---|
| Fixed engagement fee | [Currency and amount] | [e.g., 50% at kickoff; 50% on final report] |
| Time-and-materials rate, if applicable | [Currency and amount per hour/day] | Monthly / as incurred |
| Retest fee | [Currency and amount / included hours] | [Trigger] |
| Pre-approved travel or expenses | [Cap / reimbursement terms] | [Trigger] |
| Change-order rate | [Currency and amount] | On approved additional work |

Invoices are payable within **[number]** days of receipt, subject to the governing agreement. Taxes, expenses, cancellation terms, and late-payment provisions are governed by **[MSA / applicable clause]**.

## 13. Assumptions, limitations, and exclusions

This SOW is based on the following assumptions: **[examples: accurate asset inventory; timely test-account provisioning; availability of technical contacts; stable non-production test environment; approved allowlisting; no material scope changes]**. Delays or incomplete dependencies may require a change to the schedule, scope, or fees.

Unless explicitly stated otherwise, the engagement excludes source-code review, architecture review, mobile testing, physical security testing, social engineering, wireless assessment, denial-of-service testing, third-party service testing, regulatory compliance attestation, and continuous monitoring. The Client acknowledges that security testing is point-in-time and cannot establish that a system is secure or free from defects.

## 14. Closing, cleanup, and retesting

At the end of testing, the Provider will cease activity; remove or return agreed temporary materials; delete test data and artifacts in accordance with Section 8; provide a closeout confirmation; and advise the Client of any required cleanup actions. The Client will revoke test accounts, remove allowlist entries, and validate removal of temporary access.

If retesting is included, the Client will identify the remediated findings, relevant assets, and remediation evidence before the retest period. Retesting is limited to validation of the previously reported items unless a change order expands scope.

## 15. Signatures

By signing below, the parties confirm that they have read and approve this SOW and its appendices, including the Rules of Engagement. Each signatory represents that they have authority to bind their organization.

| Client | Service Provider |
|---|---|
| **Legal name:** [Client legal name]  
**Authorized signatory:** [Name]  
**Title:** [Title]  
**Signature:** ____________________  
**Date:** [Date] | **Legal name:** [Provider legal name]  
**Authorized signatory:** [Name]  
**Title:** [Title]  
**Signature:** ____________________  
**Date:** [Date] |

---

# Appendix A — Asset and Scope Register

| Asset ID | Asset type | Identifier / location | Environment | Owner | Authorized activities | Constraints / notes |
|---|---|---|---|---|---|---|
| [A-001] | [Domain / IP range / application / API / cloud account] | [Value] | [Production / staging / lab] | [Name/team] | [List] | [Rate limits, prohibited paths, data constraints] |
| [A-002] | [Type] | [Value] | [Environment] | [Name/team] | [List] | [Notes] |

**Explicitly out of scope:** [List domains, ranges, endpoints, environments, third-party services, people, facilities, and techniques that are excluded.]  

**Source-of-truth owner:** [Name, title, contact details]  

**Last updated:** [Date and time, time zone]

# Appendix B — Rules of Engagement Quick Reference

| RoE topic | Engagement-specific instruction |
|---|---|
| Authorized window | [Date/time/time zone] |
| Test source IP addresses | [Values] |
| Testing rate limits | [Values] |
| Permitted methods | [Values] |
| Prohibited methods | [Values] |
| Sensitive-data handling | [Values] |
| Critical finding threshold | [Define] |
| Stop conditions | [Values] |
| Emergency contact | [Name, telephone, email] |
| Scope-change authority | [Name/title] |
| Secure delivery method | [Values] |

# Appendix C — Reporting and Risk-Rating Convention

| Severity | General characterization | Expected notification and remediation priority |
|---|---|---|
| Critical | [Describe using Client risk model] | [Immediate notification; expedited containment] |
| High | [Describe] | [Prompt notification and prioritized remediation] |
| Medium | [Describe] | [Planned remediation] |
| Low | [Describe] | [Address through normal improvement cycle] |
| Informational | [Describe] | [Consider for hardening or monitoring] |

# Appendix D — Authorized Personnel and Contacts

| Organization | Name | Role | Email | Telephone | Availability / escalation authority |
|---|---|---|---|---|---|
| Client | [Name] | [Role] | [Email] | [Phone] | [Details] |
| Provider | [Name] | [Role] | [Email] | [Phone] | [Details] |

# References

[1]: https://csrc.nist.gov/glossary/term/rules_of_engagement "NIST CSRC Glossary: Rules of Engagement"
[2]: https://owasp.org/www-project-web-security-testing-guide/ "OWASP Web Security Testing Guide"
[3]: https://csrc.nist.gov/pubs/sp/800/115/final "NIST SP 800-115: Technical Guide to Information Security Testing and Assessment"

---

**Template-use note:** Replace every bracketed placeholder, remove inapplicable provisions, add organization-specific privacy, procurement, regulatory, and insurance terms, and obtain written authorization before any testing starts.
