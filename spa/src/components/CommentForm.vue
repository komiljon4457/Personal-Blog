<script setup>
import { reactive, ref } from "vue";
import { api } from "../services/api.js";

const props = defineProps({
  slug: { type: String, required: true },
});
const emit = defineEmits(["posted"]);

const form = reactive({ name: "", email: "", comment: "" });
const message = ref("");
const messageKind = ref("");
const submitting = ref(false);

async function submit() {
  submitting.value = true;
  message.value = "Submitting…";
  messageKind.value = "";
  try {
    const res = await api.addComment(props.slug, { ...form });
    message.value = "✓ Comment received — it will appear once approved.";
    messageKind.value = "ok";
    form.name = form.email = form.comment = "";
    emit("posted", res);
  } catch (err) {
    message.value = err.fields ? Object.values(err.fields).join(" ") : err.message;
    messageKind.value = "error";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="submit">
    <fieldset>
      <legend>Your comment</legend>
      <div class="form-grid-2">
        <div class="form-row">
          <label for="cf-name">Name <span class="required-mark">*</span></label>
          <input id="cf-name" v-model="form.name" required minlength="2" maxlength="60" />
        </div>
        <div class="form-row">
          <label for="cf-email">Email <span class="required-mark">*</span></label>
          <input id="cf-email" v-model="form.email" type="email" required />
        </div>
      </div>
      <div class="form-row">
        <label for="cf-comment">Comment <span class="required-mark">*</span></label>
        <textarea id="cf-comment" v-model="form.comment" required minlength="5" maxlength="1000"></textarea>
      </div>
    </fieldset>

    <p v-if="message" class="notice" :class="messageKind === 'ok' ? 'notice--success' : messageKind === 'error' ? 'notice--error' : ''">
      {{ message }}
    </p>

    <div class="form-actions">
      <button class="btn" type="submit" :disabled="submitting">Post comment</button>
    </div>
  </form>
</template>
