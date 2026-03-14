import type { InfobarContent } from '@/components/ui/infobar';

export const workspacesInfoContent: InfobarContent = {
  title: 'Workspaces Management',
  sections: [
    {
      title: 'Overview',
      description:
        'The Workspaces page allows you to manage your workspaces and switch between them. This feature uses Supabase Auth with organization metadata for multi-tenant workspace management. You can view all available workspaces, create new ones, and switch your active workspace.',
      links: [
        {
          title: 'Supabase Auth Documentation',
          url: 'https://supabase.com/docs/guides/auth'
        }
      ]
    },
    {
      title: 'Creating Workspaces',
      description:
        'To create a new workspace, configure organizations via the Supabase dashboard or API. Organizations are stored in user metadata or a dedicated database table. Once created, you can switch to the new workspace and start managing it.',
      links: [
        {
          title: 'Supabase User Management',
          url: 'https://supabase.com/docs/guides/auth/managing-user-data'
        }
      ]
    },
    {
      title: 'Switching Workspaces',
      description:
        'You can switch between workspaces by clicking on a workspace in the list. The selected workspace becomes your active organization context, and all organization-specific features will use this workspace.',
      links: []
    },
    {
      title: 'Workspace Features',
      description:
        'Each workspace operates independently with its own team members, roles, permissions, and billing. This allows you to manage multiple projects or teams within a single account while keeping their data and settings separate.',
      links: []
    },
    {
      title: 'Server-Side Permission Checks',
      description:
        'This application uses Supabase Row Level Security (RLS) policies for server-side permission checks. These ensure that users can only access resources for their active organization.',
      links: [
        {
          title: 'Supabase RLS Documentation',
          url: 'https://supabase.com/docs/guides/auth/row-level-security'
        }
      ]
    }
  ]
};

export const teamInfoContent: InfobarContent = {
  title: 'Team Management',
  sections: [
    {
      title: 'Overview',
      description:
        'The Team Management page allows you to manage your workspace team, including members, roles, security settings, and more. Team management is handled through Supabase Auth and your database schema.',
      links: [
        {
          title: 'Supabase Auth Documentation',
          url: 'https://supabase.com/docs/guides/auth'
        }
      ]
    },
    {
      title: 'Managing Team Members',
      description:
        'You can add, remove, and manage team members from this page. Invite new members by email, assign roles, and control their access levels. Each member can have different permissions based on their role.',
      links: []
    },
    {
      title: 'Roles and Permissions',
      description:
        'Configure roles and permissions in your Supabase database schema. Roles define what actions team members can perform within the workspace. Common roles include admin, member, and custom roles you define.',
      links: [
        {
          title: 'Supabase RLS Documentation',
          url: 'https://supabase.com/docs/guides/auth/row-level-security'
        }
      ]
    },
    {
      title: 'Security Settings',
      description:
        "Manage security settings for your workspace, including authentication requirements, session management, and access controls. These settings help protect your organization's data and resources.",
      links: []
    },
    {
      title: 'Organization Settings',
      description:
        'Configure general organization settings such as name, logo, and other workspace preferences. These settings apply to the entire workspace and affect all team members.',
      links: []
    },
    {
      title: 'Navigation RBAC System',
      description:
        'The application includes a fully client-side navigation filtering system using the `useNav` hook. It supports `requireOrg`, `permission`, and `role` checks for instant access control. Navigation items are configured in `src/config/nav-config.ts` with `access` properties.',
      links: []
    }
  ]
};

export const billingInfoContent: InfobarContent = {
  title: 'Billing & Plans',
  sections: [
    {
      title: 'Overview',
      description:
        "The Billing page allows you to manage your organization's subscription and usage limits. Integrate a billing provider like Stripe with Supabase for subscription management.",
      links: [
        {
          title: 'Supabase + Stripe Guide',
          url: 'https://supabase.com/docs/guides/getting-started/tutorials/with-stripe-subscriptions'
        }
      ]
    },
    {
      title: 'Available Plans',
      description:
        'View and subscribe to available plans. Plans can be managed through your billing provider (e.g., Stripe). Common plans include free, pro, and team tiers.',
      links: []
    },
    {
      title: 'Plan Features',
      description:
        'Each plan can include specific features that unlock functionality in the application. Features can be stored in user or organization metadata and checked in code.',
      links: []
    },
    {
      title: 'Access Control',
      description:
        'Plans and features are used for access control throughout the application. Server-side checks use Supabase RLS policies or metadata checks. Client-side protection conditionally renders content based on subscription status.',
      links: []
    },
    {
      title: 'Setup Requirements',
      description:
        'To enable billing, integrate Stripe or your preferred payment provider with Supabase. Use webhooks to sync subscription status to your database.',
      links: [
        {
          title: 'Stripe Integration Guide',
          url: 'https://supabase.com/docs/guides/getting-started/tutorials/with-stripe-subscriptions'
        }
      ]
    }
  ]
};

export const productInfoContent: InfobarContent = {
  title: 'Product Management',
  sections: [
    {
      title: 'Overview',
      description:
        'The Products page allows you to manage your product catalog. You can view all products in a table format with server-side functionality including sorting, filtering, pagination, and search capabilities. Use the "Add New" button to create new products.',
      links: [
        {
          title: 'Product Management Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Adding Products',
      description:
        'To add a new product, click the "Add New" button in the page header. You will be taken to a form where you can enter product details including name, description, price, category, and upload product images.',
      links: [
        {
          title: 'Adding Products Documentation',
          url: '#'
        }
      ]
    },
    {
      title: 'Editing Products',
      description:
        'You can edit existing products by clicking on a product row in the table. This will open the product edit form where you can modify any product information. Changes are saved automatically when you submit the form.',
      links: [
        {
          title: 'Editing Products Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Deleting Products',
      description:
        'Products can be deleted from the product listing table. Click the delete action for the product you want to remove. You will be asked to confirm the deletion before the product is permanently removed from your catalog.',
      links: [
        {
          title: 'Product Deletion Policy',
          url: '#'
        }
      ]
    },
    {
      title: 'Table Features',
      description:
        'The product table includes several powerful features to help you manage large product catalogs efficiently. You can sort columns by clicking on column headers, filter products using the filter controls, navigate through pages using pagination, and quickly find products using the search functionality.',
      links: [
        {
          title: 'Table Features Documentation',
          url: '#'
        },
        {
          title: 'Sorting and Filtering Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Product Fields',
      description:
        'Each product can have the following fields: Name (required), Description (optional text), Price (numeric value), Category (for organizing products), and Image Upload (for product photos). All fields can be edited when creating or updating a product.',
      links: [
        {
          title: 'Product Fields Specification',
          url: '#'
        }
      ]
    }
  ]
};
