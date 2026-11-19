@file-storage @admin
Feature: Uploading images
  Images uploaded in the content editor are stored, cached in several sizes
  and shown on the public site.

  Scenario Outline: Publishing a page with a <format> primary image
    Given I am logged in as an administrator
    When I publish a page titled "Gallery" with the primary image "<file>"
    Then the file cache holds the image with its small, medium and source variants
    And the cached source is identical to the uploaded file
    And the page "Gallery" shows the uploaded image

    Examples:
      | format | file           |
      | JPG    | test-image.jpg |
      | PNG    | test-image.png |
      | GIF    | test-image.gif |
