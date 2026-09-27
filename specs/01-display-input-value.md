# Inputs page: display a submitted value

- **Area:** inputs
- **Purpose:** verify the Inputs page displays a number after it is submitted.
- **Preconditions:** none; begin with a fresh page state.
- **Steps:**
  1. Open `https://practice.expandtesting.com/inputs`.
  2. Enter `42` in the number field.
  3. Click **Display Inputs**.
- **Expected:** the output displays `42` as the submitted number.
- **Seed:** `../tests/seed.spec.ts`
- **Automated spec:** `../tests/demo-inputs.spec.ts`
