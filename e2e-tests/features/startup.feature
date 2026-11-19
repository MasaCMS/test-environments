@file-storage @anonymous
Feature: Startup
  The application starts and reloads cleanly with the file storage service.

  Scenario: Reloading the application
    When I reload the application
    Then the public site renders without engine errors
