import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { DefaultLayout } from '@/layouts/default-layout';
import { HomePage } from '@/pages/home';
import { NewMemoPage } from '@/pages/new';
import { EditMemoPage } from '@/pages/edit';
import { MemoDetailPage } from '@/pages/memo-detail';
import { FriendPage } from '@/pages/friend';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { UserSettingsPage } from '@/pages/user-settings';
import { UserCalendarPage } from '@/pages/user-calendar';
import { UserProfilePage } from '@/pages/user-profile';
import { SysSettingsPage } from '@/pages/sys-settings';
import { TagsPage } from '@/pages/tags';
import { LocationPage } from '@/pages/location';
import { OAuthCallbackPage } from '@/pages/oauth-callback';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <DefaultLayout>
        <HomePage />
      </DefaultLayout>
    ),
  },
  {
    path: '/new',
    element: (
      <DefaultLayout>
        <NewMemoPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/edit/:id',
    element: (
      <DefaultLayout>
        <EditMemoPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/memo/:id',
    element: (
      <DefaultLayout>
        <MemoDetailPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/friend',
    element: (
      <DefaultLayout>
        <FriendPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/user/login',
    element: (
      <DefaultLayout>
        <LoginPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/user/reg',
    element: (
      <DefaultLayout>
        <RegisterPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/user/settings',
    element: (
      <DefaultLayout>
        <SysSettingsPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/user/calendar',
    element: (
      <DefaultLayout>
        <UserCalendarPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/user/:id',
    element: (
      <DefaultLayout>
        <UserProfilePage />
      </DefaultLayout>
    ),
  },
  {
    path: '/sys/settings',
    element: (
      <DefaultLayout>
        <SysSettingsPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/tags/:username/:tag',
    element: (
      <DefaultLayout>
        <TagsPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/location/:username/:location',
    element: (
      <DefaultLayout>
        <LocationPage />
      </DefaultLayout>
    ),
  },
  {
    path: '/oauth/callback/:provider',
    element: <OAuthCallbackPage />,
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
