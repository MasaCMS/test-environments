@file-storage @admin
Feature: File content items
  A File content item serves its uploaded document and is not treated as an image.

  Scenario: Publishing a PDF
    Given I am logged in as an administrator
    When I publish a file item titled "Handbook" with the file "test-document.pdf"
    Then the file cache holds only the original file
    And the page "Handbook" serves the uploaded file
