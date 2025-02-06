import { z } from 'zod';

import { ActionEmitter } from '@/components/action-emitter';
import { Card } from '@/components/ui/card';
import { NO_CONFIRMATION_MESSAGE } from '@/lib/constants';
import { verifyUser } from '@/server/actions/user';
import { dbCreateAction } from '@/server/db/queries';

interface CreateActionResultProps {
  id: string;
  description: string;
  frequency: number;
  maxExecutions: number | null;
  startTime: number | null;
}

function getFrequencyLabel(frequency: number): string {
  if (frequency === 3600) return 'Hourly';
  if (frequency === 86400) return 'Daily';
  if (frequency === 604800) return 'Weekly';
  if (frequency === 2592000) return 'Monthly'; // Approx. 30 days
  if (frequency < 3600) {
    const minutes = Math.floor(frequency / 60);
    return `Every ${minutes} Minute${minutes > 1 ? 's' : ''}`;
  } else if (frequency < 86400) {
    const hours = Math.floor(frequency / 3600);
    return `Every ${hours} Hour${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(frequency / 86400);
    return `Every ${days} Day${days > 1 ? 's' : ''}`;
  }
}

function getNextExecutionTime(startTime: number | null): string {
  if (startTime) {
    return new Date(startTime).toLocaleString();
  }

  // Set to the next minute interval
  const nextMinute = new Date();
  nextMinute.setMilliseconds(0); // Reset milliseconds
  nextMinute.setSeconds(0); // Reset seconds

  const currentMinutes = nextMinute.getMinutes();
  nextMinute.setMinutes(currentMinutes + 1); // Move to the next minute

  return nextMinute.toLocaleString();
}

function CreateActionResult({
  id,
  description,
  frequency,
  maxExecutions,
  startTime,
}: CreateActionResultProps) {
  const frequencyLabel = getFrequencyLabel(frequency);
  const nextExecution = getNextExecutionTime(startTime);

  return (
    <Card className="bg-card p-6">
      <h2 className="mb-4 text-xl font-semibold text-card-foreground">
        Action Created Successfully! ⚡
      </h2>

      <div className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-sm font-medium text-muted-foreground">
            Description
          </div>
          <div className="mt-1 text-base font-semibold">
            {description.replace(NO_CONFIRMATION_MESSAGE, '')}
          </div>
        </div>

        <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">Frequency</span>
            <span>{frequencyLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="mr-2 font-medium text-muted-foreground">
              Next Execution
            </span>
            <span className="ml-2">{nextExecution}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-muted-foreground">
              Max Executions
            </span>
            <span>{maxExecutions !== null ? maxExecutions : 'Unlimited'}</span>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Action ID: {id}
        </div>
      </div>
    </Card>
  );
}

const createActionTool = {
  description:
    'Create an action in the database (requires confirmation). Do proper checks if the action requires additional setup before creating an action',
  displayName: '⚡ Create Action',
  parameters: z.object({
    requiresConfirmation: z.boolean().optional().default(true),
    userId: z.string().describe('User that the action belongs to'),
    conversationId: z
      .string()
      .describe('Conversation that the action belongs to'),
    name: z
      .string()
      .describe('Shorthand human readable name to classify the action.'),
    description: z
      .string()
      .describe(
        'Action description to display as the main content. Should not contain the frequency or max executions',
      ),
    frequency: z
      .number()
      .describe(
        'Frequency in seconds (3600 for hourly, 86400 for daily, or any custom intervals of 15 minutes (900))',
      ),
    maxExecutions: z
      .number()
      .optional()
      .describe('Max number of times the action can be executed'),
    startTimeOffset: z
      .number()
      .optional()
      .describe(
        'Offset in milliseconds for how long to wait before starting the action. Useful for scheduling actions in the future, e.g. 1 hour from now = 3600000',
      ),
  }),
  execute: async function (
    params: z.infer<typeof this.parameters>,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const authResult = await verifyUser();
      const userId = authResult?.data?.data?.id;

      if (!userId || userId !== params.userId) {
        return { success: false, error: 'Unauthorized' };
      }

      console.log('action params');
      console.dir(params);

      const action = await dbCreateAction({
        userId,
        conversationId: params.conversationId,
        name: params.name,
        description: `${params.description}${NO_CONFIRMATION_MESSAGE}`,
        actionType: 'default',
        frequency: params.frequency,
        maxExecutions: params.maxExecutions ?? null,
        triggered: true,
        paused: false,
        completed: false,
        priority: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        triggeredBy: [],
        stoppedBy: [],
        params: {},
        timesExecuted: 0,
        lastExecutedAt: null,
        lastFailureAt: null,
        lastSuccessAt: null,
        startTime: params.startTimeOffset
          ? new Date(Date.now() + params.startTimeOffset)
          : null,
      });

      if (!action) {
        return { success: false, error: 'Failed to create action' };
      }

      return { success: true, data: action };
    } catch (error: any) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error creating action',
      };
    }
  },
  render: (result: unknown) => {
    const typedResult = result as {
      success: boolean;
      data?: any;
      error?: string;
    };

    if (!typedResult.success) {
      return (
        <Card className="bg-destructive/10 p-6">
          <h2 className="mb-2 text-xl font-semibold text-destructive">
            Action Creation Failed
          </h2>
          <pre className="text-sm text-destructive/80">
            {JSON.stringify(typedResult, null, 2)}
          </pre>
        </Card>
      );
    }

    const { id, description, frequency, maxExecutions, startTime } =
      typedResult.data as {
        id: string;
        description: string;
        frequency: number;
        maxExecutions: number | null;
        startTime: number | null;
      };

    return (
      <>
        <ActionEmitter actionId={id} />
        <CreateActionResult
          id={id}
          description={description}
          frequency={frequency}
          maxExecutions={maxExecutions}
          startTime={startTime}
        />
      </>
    );
  },
};

export const actionTools = {
  createAction: createActionTool,
};
