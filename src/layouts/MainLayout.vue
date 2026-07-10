<template>
  <q-layout view="hHh lpr fFf">
    <!-- Header -->
    <q-header elevated style="background-color: #1976d2">
      <q-toolbar>
        <q-avatar size="36px">
          <q-icon name="inventory_2" size="24px" />
        </q-avatar>

        <q-toolbar-title class="text-weight-bold">
          Inventory Dashboard
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- Page Content -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Footer -->
    <q-footer elevated style="background-color: #1976d2">
      <q-toolbar>
        <q-toolbar-title class="text-caption text-center text-white">
          © {{ currentYear }} Inventory Dashboard — ระบบบริหารคลังเวชภัณฑ์
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>
