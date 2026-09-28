# Inputs Page Boundaries and Reset Test Plan

## Application Overview

Explore https://practice.expandtesting.com/inputs using tests/seed.spec.ts in the chromium project. The page has Number, Text, Password, and Date inputs plus Display Inputs and Clear Inputs buttons. Browser exploration showed that Display Inputs renders four corresponding output rows even when fields are blank, zero and an entered date appear in their output rows, and Clear Inputs empties the entered fields and removes the output panel. Each scenario starts from a fresh page state and is independent of the others.

## Test Scenarios

### 1. Web inputs page: additional scenarios

**Seed:** `tests/seed.spec.ts`

#### 1.1. Display an empty form

**File:** `tests/demo-inputs.spec.ts`

**Steps:**
  1. Start from a fresh Inputs page using the seed test.
    - expect: The Number, Text, Password, and Date inputs are empty, and no output panel is shown.
  2. Click Display Inputs without entering any values.
    - expect: The page stays on /inputs.
    - expect: The Output: Number, Output: Text, Output: Password, and Output: Date rows appear, each with an empty value.
    - expect: No validation message appears.

#### 1.2. Display zero and a date with other fields blank

**File:** `tests/demo-inputs.spec.ts`

**Steps:**
  1. Start from a fresh Inputs page using the seed test.
    - expect: All four inputs are empty and no output panel is shown.
  2. Enter 0 in Input: Number and 2026-09-28 in Input: Date; leave Input: Text and Input: Password empty.
    - expect: The Number field contains 0 and the Date field contains 2026-09-28.
  3. Click Display Inputs.
    - expect: Output: Number displays 0.
    - expect: Output: Date displays 2026-09-28.
    - expect: Output: Text and Output: Password display empty values.

#### 1.3. Clear displayed values and output panel

**File:** `tests/demo-inputs.spec.ts`

**Steps:**
  1. Start from a fresh Inputs page using the seed test.
    - expect: No output panel is shown.
  2. Enter 0 in Input: Number and 2026-09-28 in Input: Date, then click Display Inputs.
    - expect: The corresponding Number and Date output rows display 0 and 2026-09-28.
  3. Click Clear Inputs.
    - expect: All four input fields are empty.
    - expect: The output panel and its four output rows are no longer shown.
