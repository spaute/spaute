<script lang="ts">
  import type { ZodValidation, FormPathLeaves } from 'sveltekit-superforms';
  import { formFieldProxy, type SuperForm } from 'sveltekit-superforms/client';
  import type { z, AnyZodObject } from 'zod';

  import Errors from './Errors.svelte';

  type T = $$Generic<AnyZodObject>;

  export let form: SuperForm<ZodValidation<T>, string>;
  export let field: FormPathLeaves<z.infer<T>>;
  export let label: string;

  const { value, errors, constraints } = formFieldProxy(form as SuperForm<ZodValidation<T>, unknown>, field);
</script>

<div class="flex w-full flex-col">
  <div class="flex justify-between text-xs">
    <label
      for="{field}-input"
      class="text-xs">{label}</label
    >
    {#if !!$constraints?.maxlength}
      <p>{$value?.length || 0}/{$constraints.maxlength}</p>
    {/if}
  </div>
  <input
    id="{field}-input"
    name={field}
    type="text"
    class="h-8 w-56 rounded border-red-500 bg-neutral-200 indent-2 text-sm focus:outline-cyan-600"
    class:border={$errors}
    bind:value={$value}
    {...$constraints}
    {...$$restProps}
  />
  <Errors errors={$errors} />
</div>
