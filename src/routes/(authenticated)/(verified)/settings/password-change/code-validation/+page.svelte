<script lang="ts">
  import Button from '$lib/components/forms/Button.svelte';
  import Form from '$lib/components/forms/Form.svelte';
  import Text from '$lib/components/forms/Text.svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import type { PageData } from './$types';
  import InputsLayout from '$lib/components/forms/InputsLayout.svelte';
  import FormLayout from '$lib/components/forms/FormLayout.svelte';

  export let data: PageData;

  const form = superForm(data.form, {
    taintedMessage: null
  });
</script>

<FormLayout>
  <Form {form}>
    <InputsLayout>
      <Text
        {form}
        field="password"
        label="code de validation"
      />
      <Button
        {form}
        label="Valider"
      />
    </InputsLayout>
  </Form>
</FormLayout>
