# Driver-board interface record, 5 August 2026

Historical connectivity extracted from `ActualDriverBoard.PcbDoc`, `DriverBoard.SchDoc`, and the LiveBOM. This record describes that design revision; it is not a final Cora pin constraint set or fabrication approval.

| Group | Extracted path |
| --- | --- |
| Phase A PWM | J4.7 / J4.8 to UCC21222 INA / INB |
| Phase B PWM | J4.9 / J5.2 to UCC21222 INA / INB |
| Phase C PWM | J5.3 / J5.5 to UCC21222 INA / INB |
| DISABLE | J4.10 to the gate-driver DIS inputs; active high |
| Hall A/B/C | J5.1 / J5.4 / J5.6, through input filtering |
| Current A/B/C | J3.1 / J3.2 / J3.3 from AMC1300 and differential amplifier paths |
| Phase / bus voltage | J3.4 / J3.5 through divider and isolated amplifier paths |
| Motor temperature | J3.6 |

The reviewed board exposes independent high/low drive inputs. Three phase duty values therefore correspond to six physical PWM logic outputs in the implemented RTL. Current acquisition, analog calibration, connector compatibility, Hall voltage levels, and the final pin assignment remain integration decisions.

The board extraction raised supply/pin-mapping concerns around OPA4388 and the isolated supply path. Resolution requires the final CAD revision and electrical verification. The team schematic images are documented with dated provenance in the website's PCB chapter.
