# Personal Skills Library

This repository is a public collection of independently installable agent skills maintained by one owner.

## Language

**Skill Library**:
The public collection that groups the owner's skills for discovery and distribution.
_Avoid_: Skill package, skill bundle

**Installable Skill**:
A self-contained unit that remains usable when installed without any other skill from this library.
_Avoid_: Module, plugin

**Related Skill**:
An installable skill with a documented conceptual or workflow relationship to another skill, but no installation or runtime dependency on it.
_Avoid_: Dependent skill, child skill

**Pack**:
An optional distribution selection that installs several skills together without creating dependencies between them.
_Avoid_: Dependency group, bundle

**Portable Skill**:
An installable skill that follows the Agent Skills specification without relying on one agent platform's proprietary behavior.
_Avoid_: Generic skill, universal skill

**Platform-Specific Skill**:
An installable skill whose declared compatibility intentionally limits it to a particular agent platform or capability.
_Avoid_: Special skill

**Published Skill**:
A public skill that can be installed from its GitHub source; appearance on skills.sh is eventual discovery, not the publication boundary.
_Avoid_: Listed skill

**Featured Skill**:
A published skill given primary placement in the library's landing documentation without receiving different installation or discovery behavior.
_Avoid_: Homepage skill, default skill

**Canonical Skill Source**:
The single maintained repository location from which a published skill is validated and released.
_Avoid_: Primary copy, upstream copy

**Draft Skill**:
A skill that has not passed the library's publication checks and therefore is not part of the public main branch.
_Avoid_: Experimental skill, unpublished skill

**Release**:
A repository-wide tagged snapshot of published skills intended for reproducible installation.
_Avoid_: Skill version, deployment

**Policy Version**:
The version embedded in a policy's managed output and manifest, independent of the library release that distributes it.
_Avoid_: Skill version, repository version
