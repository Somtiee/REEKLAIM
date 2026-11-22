# ReeKlaim release checklist

## Feature inventory

| Feature | Classification |
| --- | --- |
| Landing page | Implemented and verified locally |
| QoreX connection | Implemented but live verification pending |
| Genuine authentication | Implemented but live verification pending |
| Secure sessions | Implemented and verified locally. Hosted HTTPS/extension compatibility pending |
| Database persistence | Implemented and verified locally |
| Private storage | Implemented and verified locally. Hosted durable volume and restore pending |
| Item registration | Implemented but live verification pending |
| QR generation | Implemented and verified locally |
| Public QR recovery | Implemented and verified locally |
| Lost and found reports | Implemented and verified locally |
| Marketplace search | Implemented and verified locally |
| Ownership claims | Implemented and verified locally |
| Matching | Implemented and verified locally |
| Private coordination | Implemented and verified locally |
| Recovery confirmation | Implemented and verified locally |
| Finder rewards | Implemented but live verification pending. Atomic combined rewards remain gated |
| Platform fees | Implemented but live verification pending. Public collection remains gated |
| Ownership transfers | Implemented but live verification pending |
| Dashboard | Implemented and verified locally |
| Notifications | Implemented and verified locally. Match generation is on demand |
| Organization portal | Implemented and verified locally for internal custody MVP |
| Light and dark mode | Implemented and verified locally |

## Release gates

- [ ] Demonstrate genuine QoreX approve/reject and canonical hybrid receipts on Diana, including authentication and registration.
- [ ] Rehearse a genuine transfer, finder reward and exact fee validation before enabling collection. Keep the multi-message reward switch closed until atomic settlement is proven.
- [ ] Validate reverse-proxy origin/Host handling, cookies, HTTPS, certificate verification, CSP extension compatibility and trusted client limits on the deployment host.
- [ ] Provision separate database roles, a durable private volume, protected keys, and rehearse restoration of both database and evidence together.
- [ ] Establish human moderation, retention, deletion-request processing and incident response. Secure any future operator access.
- [ ] Complete linked multi-user browser journeys, including tag intake through owner coordination. Rehearse a fee-bearing reward when the live atomic gate is ready.
- [ ] Finish manual keyboard testing and the broader accessibility review. Check performance and browser diagnostics on the deployment configuration.
- [ ] Obtain organizer clarification on native-only eligibility and confirm submission requirements and the deployment URL.

Development snapshots, browser screenshots and published manifests should be reviewed separately before any external publication.

## Phase 9B release gate

- [ ] Verify genuine QoreX onboarding and all Diana settlement flows.
- [ ] Verify hosted private storage and restore, including existing encrypted evidence.
- [ ] Complete tenant-linked recovery and integrated QA.
- [ ] Confirm eligibility and obtain separate deployment approval.

[Phase 9B decision](PRE_DEPLOYMENT_GO_NO_GO.md)

[Phase 10 decision and release evidence](PHASE_10_REPORT.md)
