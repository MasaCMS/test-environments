@file-manager @admin
Feature: File upload and management
  Administrators upload files in the File Browser, organise them in folders,
  rename, download and delete them.

  Background:
    Given I am logged in as an administrator
    And I am in the file browser

  Scenario: Uploading various file types
    When I upload these files:
      | test-image.jpg    | photo.jpg    |
      | test-image.png    | picture.png  |
      | test-image.gif    | anim.gif     |
      | test-document.pdf | report.pdf   |
      | test-note.txt     | note.txt     |
    Then the file browser lists "photo.jpg, picture.png, anim.gif, report.pdf, note.txt"

  Scenario: Creating a folder and uploading into it
    When I create the folder "Holiday photos"
    Then the folder "Holiday photos" is listed
    When I open the folder "Holiday photos"
    And I upload the fixture "test-image.jpg" as "beach.jpg"
    Then the file browser lists "beach.jpg"

  Scenario: Renaming an image keeps its extension
    Given the fixture "test-image.jpg" is uploaded as "old-name.jpg"
    When I open the file "old-name.jpg"
    And I rename the open file to "new-name-<unique>"
    Then the file browser lists "new-name.jpg"
    And the file browser does not list "old-name.jpg"

  Scenario: Downloading an image returns what was uploaded
    Given the fixture "test-image.png" is uploaded as "download.png"
    When I open the file "download.png"
    Then the downloaded file is identical to the fixture "test-image.png"

  Scenario: Deleting an image
    Given the fixture "test-image.gif" is uploaded as "delete-me.gif"
    When I open the file "delete-me.gif"
    And I delete the open file
    Then the file browser does not list "delete-me.gif"

  Scenario: A text file can be edited in the file browser
    Given the fixture "test-note.txt" is uploaded as "editable.txt"
    When I open the text file "editable.txt"
    Then the text file shows "File storage test"
    When I replace the text with "Changed in the file browser"
    And I open the text file "editable.txt"
    Then the text file shows "Changed in the file browser"

  Scenario: The file list can be filtered by name
    Given the fixture "test-note.txt" is uploaded as "findme.txt"
    And the fixture "test-note.txt" is uploaded as "other.txt"
    When I filter the file list by "findme-<unique>"
    Then only "findme.txt" is listed

  Scenario: The site files and the application root can be browsed
    When I open the file browser area "Site Files"
    Then the file browser lists "assets"
    When I open the file browser area "Application Root"
    Then the file browser lists "admin"
