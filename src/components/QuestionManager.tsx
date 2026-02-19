import React, { useState } from 'react';
import { useTestQuestions, useAddQuestion, useDeleteQuestion, useAddOption, useDeleteOption } from '@/hooks/useQuestionManagement';
import { useRLSErrorHandler } from '@/hooks/useRLSErrorHandler';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';

interface QuestionManagerProps {
  testId: string;
  testTitle?: string;
  centerId?: string;
}

type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank';

export const QuestionManager: React.FC<QuestionManagerProps> = ({ testId, testTitle, centerId }) => {
  const { data: questions = [], isLoading } = useTestQuestions(testId);
  const { mutate: addQuestion, isPending: isAddingQuestion } = useAddQuestion(testId);
  const { mutate: deleteQuestion, isPending: isDeletingQuestion } = useDeleteQuestion();
  const { mutate: addOption, isPending: isAddingOption } = useAddOption();
  const { mutate: deleteOption, isPending: isDeletingOption } = useDeleteOption();
  const { toast } = useToast();
  const { handleError: handleRLSError, RLSErrorDialog } = useRLSErrorHandler();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    question_text: '',
    points: 1,
    explanation: '',
    topic: '',
    question_type: 'multiple_choice' as QuestionType,
  });
  const [newOptions, setNewOptions] = useState<{ text: string; is_correct: boolean }[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const handleAddQuestion = async () => {
    if (!formData.question_text.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a question',
        variant: 'destructive',
      });
      return;
    }

    // Validate options based on question type
    if (formData.question_type === 'multiple_choice' && newOptions.length < 2) {
      toast({
        title: 'Error',
        description: 'Multiple choice questions need at least 2 options',
        variant: 'destructive',
      });
      return;
    }

    if (formData.question_type === 'true_false' && newOptions.length === 0) {
      toast({
        title: 'Error',
        description: 'True/False questions need both True and False options',
        variant: 'destructive',
      });
      return;
    }

    if ((formData.question_type === 'multiple_choice' || formData.question_type === 'true_false') && 
        !newOptions.some(opt => opt.is_correct)) {
      toast({
        title: 'Error',
        description: 'At least one option must be marked as correct',
        variant: 'destructive',
      });
      return;
    }

    addQuestion(formData, {
      onSuccess: async (createdQuestion: any) => {
        // Add options to the question
        for (let i = 0; i < newOptions.length; i++) {
          const opt = newOptions[i];
          await addOption(
            {
              question_id: createdQuestion.id,
              option_text: opt.text,
              option_letter: String.fromCharCode(65 + i), // A, B, C, D...
              is_correct: opt.is_correct,
              order_index: i,
            },
            {
              onError: (err: any) => {
                console.error('Failed to add option:', err);
              },
            }
          );
        }

        setFormData({
          question_text: '',
          points: 1,
          explanation: '',
          topic: '',
          question_type: 'multiple_choice',
        });
        setNewOptions([]);
        setShowForm(false);
        toast({
          title: 'Success',
          description: 'Question and options added successfully',
        });
      },
      onError: (error: any) => {
        // Check if it's an RLS policy error
        if (handleRLSError(error)) {
          return; // RLS dialog will show
        }
        toast({
          title: 'Error',
          description: error.message || 'Failed to add question',
          variant: 'destructive',
        });
      },
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      deleteQuestion(questionId, {
        onSuccess: () => {
          toast({
            title: 'Success',
            description: 'Question deleted successfully',
          });
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to delete question',
            variant: 'destructive',
          });
        },
      });
    }
  };

  const handleDeleteOption = (optionId: string) => {
    deleteOption(optionId, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Option deleted successfully',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete option',
          variant: 'destructive',
        });
      },
    });
  };

  const addNewOption = () => {
    if (formData.question_type === 'multiple_choice') {
      setNewOptions([...newOptions, { text: '', is_correct: false }]);
    } else if (formData.question_type === 'true_false') {
      if (newOptions.length < 2) {
        setNewOptions([...newOptions, { text: newOptions.length === 0 ? 'True' : 'False', is_correct: false }]);
      }
    }
  };

  const updateOption = (index: number, text: string) => {
    const updated = [...newOptions];
    updated[index].text = text;
    setNewOptions(updated);
  };

  const toggleCorrect = (index: number) => {
    const updated = [...newOptions];
    if (formData.question_type === 'true_false' || formData.question_type === 'fill_blank') {
      // Only one correct answer
      updated.forEach((opt, i) => {
        opt.is_correct = i === index;
      });
    } else {
      // Multiple choice can have multiple correct
      updated[index].is_correct = !updated[index].is_correct;
    }
    setNewOptions(updated);
  };

  const removeNewOption = (index: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setNewOptions([]);
            }
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Question Text *</label>
            <Textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              placeholder="Enter your question..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Points</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Question Type *</label>
              <select
                className="w-full border rounded-md p-2"
                value={formData.question_type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  setFormData({ ...formData, question_type: newType });
                  setNewOptions([]);
                }}
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="fill_blank">Fill Blank</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Explanation</label>
            <Textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Optional explanation..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Topic</label>
            <Input
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Optional topic..."
            />
          </div>

          {/* Answer options section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium">
                {formData.question_type === 'multiple_choice' ? 'Answer Options *' : 'Answers *'}
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addNewOption}
                disabled={formData.question_type === 'true_false' && newOptions.length >= 2}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Option
              </Button>
            </div>

            <div className="space-y-3">
              {newOptions.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(idx)}
                    className="flex-shrink-0"
                  >
                    {option.is_correct ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    className="flex-1"
                    disabled={formData.question_type === 'true_false'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNewOption(idx)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {newOptions.length === 0 && formData.question_type !== 'fill_blank' && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Click "Add Option" to create answers
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleAddQuestion} disabled={isAddingQuestion}>
              {isAddingQuestion && <Loader className="h-4 w-4 animate-spin mr-2" />}
              Add Question
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setNewOptions([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No questions yet. Add one to get started.</p>
        ) : (
          questions.map((question: any, index: number) => (
            <Card key={question.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium mb-2">
                    {index + 1}. {question.question_text}
                  </div>
                  {question.topic && (
                    <div className="text-sm text-muted-foreground mb-2">
                      Topic: {question.topic}
                    </div>
                  )}
                  <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                    <span>{question.points} point{question.points !== 1 ? 's' : ''}</span>
                    <span className="capitalize">{question.question_type?.replace('_', ' ')}</span>
                    {question.question_options?.length > 0 && (
                      <span>{question.question_options.length} options</span>
                    )}
                  </div>

                  {/* Show options */}
                  {question.question_options && question.question_options.length > 0 && (
                    <div className="space-y-2 mb-3 pl-4">
                      {question.question_options.map((opt: any) => (
                        <div key={opt.id} className="flex items-start gap-2">
                          {opt.is_correct ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <span className="text-sm">
                            {opt.option_letter}. {opt.option_text}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOption(opt.id)}
                            disabled={isDeletingOption}
                            className="ml-auto text-destructive hover:text-destructive p-0 h-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Explanation:</p>
                      <p className="text-muted-foreground">{question.explanation}</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteQuestion(question.id)}
                  disabled={isDeletingQuestion}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <RLSErrorDialog />
    </div>
  );
};

export default QuestionManager;
