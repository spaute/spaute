<script lang="ts">
  import Button from '$lib/components/forms/Button.svelte';
  import Form from '$lib/components/forms/Form.svelte';
  import Password from '$lib/components/forms/Password.svelte';
  import * as flashModule from 'sveltekit-flash-message/client';
  import { superForm } from 'sveltekit-superforms/client';
  import type { PageData } from './$types';
  import FormLayout from '$lib/components/forms/FormLayout.svelte';
  import InputsLayout from '$lib/components/forms/InputsLayout.svelte';

  export let data: PageData;

  const form = superForm(data.form, {
    taintedMessage: null,
    flashMessage: {
      module: flashModule
    }
  });
</script>

<FormLayout>
  <Form {form}>
    <InputsLayout>
      <Password
        {form}
        field="password"
        label="nouveau mot de passe"
        autocomplete="new-password"
      />
      <Password
        {form}
        field="passwordConfirmation"
        label="confirmation du mot de passe"
        autocomplete="new-password"
      />
      <Button
        {form}
        label="Mettre à jour"
      />
    </InputsLayout>
  </Form>
</FormLayout>
