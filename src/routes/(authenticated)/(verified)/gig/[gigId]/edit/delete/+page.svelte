<script lang="ts">
  import Button from '$lib/components/forms/Button.svelte';
  import Form from '$lib/components/forms/Form.svelte';
  import Text from '$lib/components/forms/Text.svelte';
  import FormLayout from '$lib/components/forms/FormLayout.svelte';
  import * as flashModule from 'sveltekit-flash-message/client';
  import { superForm } from 'sveltekit-superforms/client';

  import type { PageData } from './$types';
  import InputsLayout from '$lib/components/forms/InputsLayout.svelte';
  import Info from '$lib/components/layout/Info.svelte';

  export let data: PageData;

  const form = superForm(data.form, {
    taintedMessage: 'Veux tu vraiment quitter la page ? Tes modifications seront perdues.',
    flashMessage: {
      module: flashModule
    }
  });
</script>

<Info>
  Pour <b>supprimer la presta</b>, recopie son <b>titre</b> !
</Info>

<FormLayout>
  <Form {form}>
    <InputsLayout>
      <input
        type="hidden"
        name="gigId"
        value={data.gig.id}
      />
      <input
        type="hidden"
        name="name"
        value={data.gig.name}
      />
      <Text
        {form}
        field="nameCopy"
        label="nom"
      />
      <Button
        {form}
        label="Supprimer"
        danger
        disabledWhenNotTainted
      />
    </InputsLayout>
  </Form>
</FormLayout>
