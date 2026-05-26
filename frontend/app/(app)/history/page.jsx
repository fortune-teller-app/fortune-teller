import { getHistory, PRACTICE_META } from '../../../lib/api/readings';
import HistoryClient from './HistoryClient';

export default async function History() {
  const history = await getHistory({ limit: 100 });

  return (
    <HistoryClient
      readings={history.items}
      total={history.total}
      practiceMeta={PRACTICE_META}
    />
  );
}
