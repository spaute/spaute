<script lang="ts">
  import Button from '$lib/components/forms/Button.svelte';
  import Form from '$lib/components/forms/Form.svelte';
  import Select from '$lib/components/forms/Select.svelte';
  import { superForm } from 'sveltekit-superforms/client';

  import type { PageData } from './$types';
  import InputsLayout from '$lib/components/forms/InputsLayout.svelte';
  import FormLayout from '$lib/components/forms/FormLayout.svelte';

  export let data: PageData;

  const form = superForm(data.form);

  $: options = data.instruments.map((instrument) => ({
    value: instrument.id,
    label: instrument.name
  }));
</script>

<FormLayout>
  <Form {form}>
    <InputsLayout>
      <Select
        {form}
        field={'instrumentId'}
        label={'instrument'}
        {options}
      />
      <input
        type="hidden"
        name="bandId"
        value={data.band.id}
      />
      <Button
        {form}
        label="Ajouter"
      />
    </InputsLayout>
  </Form>
</FormLayout>
