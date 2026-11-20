@forms @admin
Feature: Form validation
  Forms refuse values that break their rules, say what is wrong,
  and store nothing until the values are valid.

  Background:
    Given I am logged in as an administrator

  Scenario: A required field must be filled in
    When I start a new form titled "Required form"
    And I add these fields to the form:
      | Type       | Label     | Required | Message             |
      | Text field | Your name | yes      | Please enter a name |
    And I publish the form
    And I show the form "Required form" on a new page "Required"
    And a visitor opens the page "Required"
    And the visitor submits the form
    Then the form is not accepted
    And the form reports "Please enter a name"
    And the form "Required form" has 0 responses in the admin

  Scenario: Without a message of its own, the error names the field
    When I start a new form titled "Default message form"
    And I add these fields to the form:
      | Type       | Label     | Required |
      | Text field | Your name | yes      |
    And I publish the form
    And I show the form "Default message form" on a new page "Default message"
    And a visitor opens the page "Default message"
    And the visitor submits the form
    Then the form is not accepted
    And the form reports "yourname"

  Scenario: An email address must look like one
    When I start a new form titled "Email form"
    And I add these fields to the form:
      | Type       | Label | Validation | Message                  |
      | Text field | Email | Email      | Enter a valid email      |
    And I publish the form
    And I show the form "Email form" on a new page "Email"
    And a visitor opens the page "Email"
    And the visitor fills in the form with:
      | Email | not-an-email |
    And the visitor submits the form
    Then the form is not accepted
    And the form reports "Enter a valid email"
    When the visitor fills in the form with:
      | Email | ada@example.com |
    And the visitor submits the form
    Then the form is accepted
    And the form "Email form" has 1 response in the admin

  Scenario: A number field refuses letters
    When I start a new form titled "Number form"
    And I add these fields to the form:
      | Type       | Label    | Validation | Message        |
      | Text field | Quantity | Numeric    | Numbers only   |
    And I publish the form
    And I show the form "Number form" on a new page "Number"
    And a visitor opens the page "Number"
    And the visitor fills in the form with:
      | Quantity | twelve |
    And the visitor submits the form
    Then the form is not accepted
    And the form reports "Numbers only"
    When the visitor fills in the form with:
      | Quantity | 12 |
    And the visitor submits the form
    Then the form is accepted

  Scenario: A number range can be enforced with a pattern
    When I start a new form titled "Range form"
    And I add these fields to the form:
      | Type       | Label  | Validation | Regex           | Message              |
      | Text field | Rating | Regex      | ^([1-9]\|10)$   | Rate from 1 to 10    |
    And I publish the form
    And I show the form "Range form" on a new page "Range"
    And a visitor opens the page "Range"
    And the visitor fills in the form with:
      | Rating | 11 |
    And the visitor submits the form
    Then the form is not accepted
    And the form reports "Rate from 1 to 10"
    When the visitor fills in the form with:
      | Rating | 7 |
    And the visitor submits the form
    Then the form is accepted

  Scenario: A date field refuses text
    When I start a new form titled "Date form"
    And I add these fields to the form:
      | Type       | Label    | Validation | Message         |
      | Text field | Due date | Date       | Enter a date    |
    And I publish the form
    And I show the form "Date form" on a new page "Date"
    And a visitor opens the page "Date"
    And the visitor fills in the form with:
      | Due date | next week |
    And the visitor submits the form
    Then the form is not accepted
    And the form reports "Enter a date"
    When the visitor fills in the form with:
      | Due date | 11/20/2026 |
    And the visitor submits the form
    Then the form is accepted

  Scenario: A very long value is accepted and stored
    When I start a new form titled "Long form"
    And I add these fields to the form:
      | Type      | Label   |
      | Text area | Message |
    And I publish the form
    And I show the form "Long form" on a new page "Long"
    And a visitor opens the page "Long"
    And the visitor fills in "Message" with 3000 characters
    And the visitor submits the form
    Then the form is accepted
    And the form "Long form" has 1 response in the admin

  Scenario: An optional field can stay empty
    When I start a new form titled "Optional form"
    And I add these fields to the form:
      | Type       | Label     | Required |
      | Text field | Your name | yes      |
      | Text area  | Comment   |          |
    And I publish the form
    And I show the form "Optional form" on a new page "Optional"
    And a visitor opens the page "Optional"
    And the visitor fills in the form with:
      | Your name | Ada Lovelace |
    And the visitor submits the form
    Then the form is accepted
    And the form "Optional form" has 1 response in the admin
