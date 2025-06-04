'use client';
import { Box } from '@mui/material';
import PageContainer from '@/app/components/container/PageContainer';
import SubscriptionSkeleton from './components/SubscriptionSkeleton';
import { useTranslation } from 'react-i18next';

const Loading = () => {
  const { t } = useTranslation();
  
  return (
    <PageContainer title={t('subscription.title')} description={t('subscription.description')}>
      <SubscriptionSkeleton />
    </PageContainer>
  );
};

export default Loading; 