<script lang="ts">
  import Button from '$lib/components/forms/Button.svelte';
  import Form from '$lib/components/forms/Form.svelte';
  import Text from '$lib/components/forms/Text.svelte';
  import { superForm } from 'sveltekit-superforms/client';

  import type { PageData } from './$types';
  import FormLayout from '$lib/components/forms/FormLayout.svelte';
  import InputsLayout from '$lib/components/forms/InputsLayout.svelte';

  export let data: PageData;

  const form = superForm(data.form, {
    taintedMessage: 'Veux tu vraiment quitter la page ? Tes modifications seront perdues.'
  });
</script>

<FormLayout>
  <Form {form}>
    <InputsLayout>
      <Text
        {form}
        field="name"
        label="nom"
      />
      <Button
        {form}
        label="Créer"
        disabledWhenNotTainted
      />
    </InputsLayout>
  </Form>
</FormLayout>
