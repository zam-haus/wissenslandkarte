# Entities

## Users
- ldapId: String
- username: String
- registrationDate: DateTime
- phoneNumber: String
- contactEmailAddress: String
- isContactEmailAddressPublic: bool
- description: String
- tags: List<Tag>
- image: URL

## Tags
- name

## Projects
- title: String
- owners: List<User>
- members: List<User>
- tags: List<Tag>
- mainPhoto: String,
- attachments: List<Attachments>
- creationDate: DateTime
- latestModificationDate: DateTime

## Attachments
- type: link|image|file
- url: String
- creationDate: DateTime

## Projectentries
- project: Project
- creationDate: DateTime
- latestModificationDate: DateTime
- attachments: List<Attachments>