@forms @admin
Feature: Form responses
  Administrators review the responses a form has collected,
  search them, export them and remove them.

  Background:
    Given I am logged in as an administrator
    And a form "Survey" is on the page "Survey page" with the fields "Your name, Colour"
    And visitors have submitted the form "Survey" with:
      | Your name    | Colour |
      | Ada Lovelace | Red    |
      | Grace Hopper | Blue   |
      | Alan Turing  | Red    |

  Scenario: All responses are listed
    Then the form "Survey" has 3 responses in the admin
    And the responses of the form "Survey" include:
      | Your name    | Colour |
      | Ada Lovelace | Red    |
      | Grace Hopper | Blue   |
      | Alan Turing  | Red    |

  Scenario: Responses can be searched by the exact value of a field
    Then listing the responses of "Survey" with "Colour" matching "Red" shows 2 responses
    And listing the responses of "Survey" with "Your name" matching "Grace Hopper" shows 1 response
    And listing the responses of "Survey" with "Your name" matching "Nobody" shows 0 responses

  Scenario: Responses can be exported to CSV
    Then the CSV download of the form "Survey" contains "Ada Lovelace"
    And the CSV download of the form "Survey" contains "Grace Hopper"
    And the CSV download of the form "Survey" contains "Alan Turing"

  Scenario: A response can be deleted
    When I delete the response containing "Grace Hopper" from the form "Survey"
    Then the form "Survey" has 2 responses in the admin
    And listing the responses of "Survey" with "Your name" matching "Grace Hopper" shows 0 responses
