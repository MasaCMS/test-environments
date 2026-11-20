@file-manager @admin
Feature: File browser in the content editor
  Editors pick files from the file browser while they edit a page: an image
  to show, or a file to link to.

  Background:
    Given I am logged in as an administrator

  Scenario: Inserting an image from the file browser
    Given the fixture "test-image.png" is uploaded as "editor-picture.png"
    When I start a new page titled "Page with picture" and insert the image "editor-picture.png" from the file browser
    Then the body of the page being edited contains "editor-picture-<unique>.png"
    When I publish the page being edited
    Then the public page "Page with picture" shows the image "editor-picture.png"

  Scenario: Linking text to a file from the file browser
    Given the fixture "test-image.jpg" is uploaded as "poster.jpg"
    When I start a new page titled "Page with link" with the text "See the poster" linked to the file "poster.jpg" from the file browser
    Then the body of the page being edited contains "poster-<unique>.jpg"
    When I publish the page being edited
    Then the public page "Page with link" has a working link to "poster.jpg"
