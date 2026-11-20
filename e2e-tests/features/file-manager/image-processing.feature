@file-manager @admin
Feature: Image processing in the File Browser
  Uploaded images keep their size, can be rotated and resized, and are served
  from their public address.

  Background:
    Given I am logged in as an administrator
    And the fixture "test-image.jpg" is uploaded as "picture.jpg"

  Scenario: An uploaded image shows its dimensions and can be loaded
    When I open the file "picture.jpg"
    Then the file window shows the dimensions "400x300"
    And the picture of the open file can be loaded from its address

  Scenario: Rotating an image swaps its width and height
    When I open the file "picture.jpg"
    And I edit the image
    And I rotate the image to the right
    And I go back from the image editor
    And I open the file "picture.jpg" again
    Then the file window shows the dimensions "300x400"
    When I edit the image
    And I rotate the image to the left
    And I go back from the image editor
    And I open the file "picture.jpg" again
    Then the file window shows the dimensions "400x300"

  Scenario: Resizing an image
    When I open the file "picture.jpg"
    And I edit the image
    And I resize the image to 200 by 150 pixels
    And I go back from the image editor
    And I open the file "picture.jpg" again
    Then the file window shows the dimensions "200x150"
