# Goal

People know stuff, but it can be hard to share what they know and it can be hard to find people with certain knowledge.
Since the A in ZAM stands for "(idea/knowledge/...) exchange" it wants to facilitate the sharing of knowledge.
Unfortunately it can be hard to specify what one knows and how deep the knowledge is. A good indicator of knowledge are past projects, though.
The Wissenslandkarte (WLK) or knowledge map offers an easy way of documenting projects and thus knowledge and finding people by their knowledge.

# Definitions
- ZAM: Zentrum für Austausch und Machen (Center for exchange and making)
- WLK: Wissenslandkarte (knowledge map)

# Frontend

## User interface

### MVP

- [x] The WLK shall allow users to users to reach the ZAM single sign on account registration form
- [x] The WLK shall allow users to authenticate with their ZAM single sign on credentials creating a session
- [x] The WLK shall allow users to terminate a session
- [x] The WLK shall allow users to specify their knowledge using tags
- [x] The WLK shall allow users to create project diaries
- [x] The WLK shall allow users to annotate newly created and existing projects with description, project image and tags.
- [x] The WLK shall allow users to view their project diaries
- [x] The WLK shall allow users to add entries to existing project diaries with text.
- [x] The WLK shall allow users to add entries to existing project diaries with images.
- [ ] The WLK shall allow users to add entries to existing project diaries with files.
- [?] The WLK shall allow users to add entries to existing project diaries with links.
- [?] The WLK shall allow users to add entries to existing project diaries with tags.
- [ ] The WLK shall allow users to finalize a project declaring it finished (so that it can be exported to other systems)
- [ ] The WLK shall allow users to annotate existing projects with metadata (e.g., cost, time invested,...)
- [?] The WLK shall allow users to reference external documentation of a project (e.g. project lives in github. possibly pin an entry or put it in description)
- [x] The WLK shall allow users to search for existing project diaries by tags
- [x] The WLK shall allow users to search for existing project diaries by text
- [x] The WLK shall display project diaries together with their metadata and owner
- [x] The WLK shall allow users to search for other users by knowledge
- [x] The WLK shall allow users to contact other people via email form
- [x] The WLK shall be available in German and English
- [x] The WLK shall allow users to view profile pages of other users, including a list of their projects
- [x] The WLK shall allow users to annotate their own profile with photo
- [x] The wlk shall allow users to annotate their own profile description
- [?] The wlk shall allow users to annotate their own profile with links


### Extended functionality

- [ ] The WLK shall be installable as a PWA
- [ ] The WLK shall allow users to take photos during the annotation process
- [ ] The WLK shall allow users to transfer project information and diary to a new wiki page
- [ ] The WLK shall allow users to annotate newly created and existing project diaries with videos
- [ ] The WLK shall allow users to take videos during the annotation process
- [ ] The WLK shall allow users to collaborate on a project and annotate it together
- [ ] The WLK shall allow users to form groups and represent them
- [ ] The WLK shall allow users to request a workplace for a project with information on required space and time
- [ ] The WLK shall allow users to selectivly limit personal information to roles defined by ZAM single sign on
- [x] The WLK shall allow users to only appear with a self-chosen pseudonym
- [ ] The WLK shall take referenced external documentation into consideration when full-text searching for projects
- [ ] The WLK shall provide a link preview, e.g. for youtube videos that are contained in a message/description...

## Admin interface

### MVP

- [ ] The WLK shall allow admins to remove project diaries
- [ ] The WLK shall allow admins to remove users, removing or resign all projects to someone else
- [ ] The WLK shall allow admins to edit project diaries and their metadata
- [ ] The WLK shall allow admins to create project diaries and their metadata for other people

### Extended functionality

- [ ] The WLK shall allow admins to assign roles to users that grant them a subset of the admin's rights
- [ ] The WLK shall allow admin to respond to space and time requests

## Wishes, to be specified more clearly

- [ ] The WLK shall allow ranking of project diaries
- [ ] Finalizing a project shall reward the user in some way, e.g. by printing a sticker with the project
