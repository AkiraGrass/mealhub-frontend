<script setup lang="ts">
import { Pagination as APagination } from 'ant-design-vue';

const props = defineProps<{
  page: number;
  lastPage: number;
}>();

const emit = defineEmits<{
  (event: 'prev'): void;
  (event: 'next'): void;
}>();

const handleChange = (nextPage: number): void => {
  if (nextPage > props.page) {
    emit('next');
    return;
  }
  if (nextPage < props.page) {
    emit('prev');
  }
};
</script>

<template>
  <APagination :current="page" :total="lastPage * 10" :page-size="10" simple @change="handleChange" />
</template>
