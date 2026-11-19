@file-storage @admin
Feature: Deleting and purging content with files
  Deleting only marks content as deleted. Emptying the trash removes its files.

  Scenario: Delete, restore, delete again and purge
    Given I am logged in as an administrator
    And a page titled "Disposable" with the primary image "test-image.jpg" is published
    When I delete the page "Disposable"
    Then the page "Disposable" is in the trash
    And the uploaded image is still served
    When I restore the page "Disposable" from the trash
    Then the page "Disposable" shows the uploaded image
    When I delete the page "Disposable"
    And I empty the trash
    Then the file cache holds no files for the upload
    And the page "Disposable" is no longer on the public site
