import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom";
import { createLeague, CreateLeagueRequest } from "../../../services/leagueService";
import * as S from "./CreateLeagueForm.scss";

interface CreateLeagueFormProps {
  onCancel?: () => void;
}

const schema = yup.object().shape({
  name: yup
    .string()
    .required("League name is required")
    .min(3, "League name must be at least 3 characters")
    .max(100, "League name must not exceed 100 characters")
    .matches(
      /^[a-zA-Z0-9\s\-_]+$/,
      "League name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  description: yup
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  is_private: yup.boolean().required(),
  max_teams: yup
    .number()
    .required("Maximum teams is required")
    .min(2, "League must have at least 2 teams")
    .max(100, "League cannot have more than 100 teams")
    .integer("Maximum teams must be a whole number"),
  draft_method: yup
    .string()
    .oneOf(["sequential", "snake", "auction"], "Invalid draft method")
    .required(),
  scoring_system: yup
    .string()
    .oneOf(["inverted_position", "traditional"], "Invalid scoring system")
    .required(),
});

type FormData = yup.InferType<typeof schema>;

const CreateLeagueForm: React.FC<CreateLeagueFormProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLeague, setCreatedLeague] = useState<{
    code: string;
    invite_link: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      is_private: true,
      max_teams: 20,
      draft_method: "sequential",
      scoring_system: "inverted_position",
    },
  });

  const maxTeams = watch("max_teams");
  const isPrivate = watch("is_private");

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const request: CreateLeagueRequest = {
        name: data.name,
        description: data.description || undefined,
        is_private: data.is_private,
        max_teams: data.max_teams,
        draft_method: data.draft_method,
        scoring_system: data.scoring_system,
      };

      const response = await createLeague(request);
      setCreatedLeague({
        code: response.code,
        invite_link: response.invite_link,
      });
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Failed to create league:", error);
      if (error.response?.data?.detail) {
        setApiError(error.response.data.detail);
      } else {
        setApiError("Failed to create league. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (createdLeague?.code) {
      try {
        await navigator.clipboard.writeText(createdLeague.code);
        alert("League code copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  const handleCopyLink = async () => {
    if (createdLeague?.invite_link) {
      try {
        await navigator.clipboard.writeText(createdLeague.invite_link);
        alert("Invite link copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  const handleGoToLeague = () => {
    if (createdLeague?.code) {
      // Navigate to league detail page
      navigate(`/leagues/${createdLeague.code}`);
    }
  };

  const handleCreateAnother = () => {
    setShowSuccess(false);
    setCreatedLeague(null);
    reset();
  };

  if (showSuccess && createdLeague) {
    return (
      <S.SuccessContainer>
        <S.SuccessIcon
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </S.SuccessIcon>
        <S.SuccessTitle>League Created Successfully!</S.SuccessTitle>
        <S.SuccessMessage>
          Your league is ready to go. Share the invite code or link with friends
          to get started.
        </S.SuccessMessage>

        <S.CodeSection>
          <S.CodeLabel>League Code</S.CodeLabel>
          <S.CodeBox>
            <S.CodeValue>{createdLeague.code}</S.CodeValue>
            <S.CopyButton onClick={handleCopyCode} type="button">
              Copy
            </S.CopyButton>
          </S.CodeBox>
        </S.CodeSection>

        <S.LinkSection>
          <S.LinkLabel>Invite Link</S.LinkLabel>
          <S.LinkBox>
            <S.LinkValue>{createdLeague.invite_link}</S.LinkValue>
            <S.CopyButton onClick={handleCopyLink} type="button">
              Copy
            </S.CopyButton>
          </S.LinkBox>
        </S.LinkSection>

        <S.ButtonGroup>
          <S.PrimaryButton onClick={handleGoToLeague} type="button">
            Go to League
          </S.PrimaryButton>
          <S.SecondaryButton onClick={handleCreateAnother} type="button">
            Create Another League
          </S.SecondaryButton>
        </S.ButtonGroup>
      </S.SuccessContainer>
    );
  }

  return (
    <S.FormContainer>
      <S.FormHeader>
        <S.Title>Create New League</S.Title>
        <S.Subtitle>
          Set up your fantasy F1 league and invite friends to compete
        </S.Subtitle>
      </S.FormHeader>

      {apiError && <S.ErrorMessage>{apiError}</S.ErrorMessage>}

      <S.Form onSubmit={handleSubmit(onSubmit)}>
        <S.FormGroup>
          <S.Label htmlFor="name">
            League Name <S.Required>*</S.Required>
          </S.Label>
          <S.Input
            id="name"
            type="text"
            placeholder="Enter league name"
            {...register("name")}
            disabled={isLoading}
            hasError={!!errors.name}
          />
          {errors.name && <S.ErrorText>{errors.name.message}</S.ErrorText>}
          <S.HelpText>
            3-100 characters. Letters, numbers, spaces, hyphens, and
            underscores only.
          </S.HelpText>
        </S.FormGroup>

        <S.FormGroup>
          <S.Label htmlFor="description">Description (Optional)</S.Label>
          <S.Textarea
            id="description"
            rows={4}
            placeholder="Enter a brief description of your league..."
            {...register("description")}
            disabled={isLoading}
            hasError={!!errors.description}
          />
          {errors.description && (
            <S.ErrorText>{errors.description.message}</S.ErrorText>
          )}
          <S.HelpText>{500 - (watch("description")?.length || 0)} characters remaining</S.HelpText>
        </S.FormGroup>

        <S.FormGroup>
          <S.Label htmlFor="is_private">
            League Privacy <S.Required>*</S.Required>
          </S.Label>
          <S.ToggleContainer>
            <S.ToggleOptions>
              <S.ToggleOption active={!isPrivate}>
                <S.Radio
                  id="public"
                  type="radio"
                  value="false"
                  {...register("is_private")}
                  disabled={isLoading}
                />
                <S.ToggleLabel htmlFor="public">Public</S.ToggleLabel>
                <S.ToggleDescription>
                  Anyone can search and join your league
                </S.ToggleDescription>
              </S.ToggleOption>

              <S.ToggleOption active={isPrivate}>
                <S.Radio
                  id="private"
                  type="radio"
                  value="true"
                  {...register("is_private")}
                  disabled={isLoading}
                />
                <S.ToggleLabel htmlFor="private">Private</S.ToggleLabel>
                <S.ToggleDescription>
                  Only users with invite code can join
                </S.ToggleDescription>
              </S.ToggleOption>
            </S.ToggleOptions>
          </S.ToggleContainer>
        </S.FormGroup>

        <S.FormGroup>
          <S.Label htmlFor="max_teams">
            Maximum Teams <S.Required>*</S.Required>
          </S.Label>
          <S.SliderContainer>
            <S.SliderInput
              id="max_teams"
              type="range"
              min={2}
              max={100}
              {...register("max_teams", { valueAsNumber: true })}
              disabled={isLoading}
            />
            <S.SliderValue>{maxTeams}</S.SliderValue>
          </S.SliderContainer>
          <S.HelpText>
            The maximum number of constructors that can join this league
          </S.HelpText>
        </S.FormGroup>

        <S.FormGroup>
          <S.Label htmlFor="draft_method">
            Draft Method <S.Required>*</S.Required>
          </S.Label>
          <S.Select
            id="draft_method"
            {...register("draft_method")}
            disabled={isLoading}
            hasError={!!errors.draft_method}
          >
            <option value="sequential">Sequential (Recommended)</option>
            <option value="snake">Snake Draft</option>
            <option value="auction">Auction Draft (Coming Soon)</option>
          </S.Select>
          {errors.draft_method && (
            <S.ErrorText>{errors.draft_method.message}</S.ErrorText>
          )}
          <S.HelpText>
            Sequential: Picks go in order (1,2,3,4,5 then 1,2,3,4,5 for second
            picks).
          </S.HelpText>
        </S.FormGroup>

        <S.FormGroup>
          <S.Label htmlFor="scoring_system">
            Scoring System <S.Required>*</S.Required>
          </S.Label>
          <S.Select
            id="scoring_system"
            {...register("scoring_system")}
            disabled={isLoading}
            hasError={!!errors.scoring_system}
          >
            <option value="inverted_position">
              Inverted Position (Recommended)
            </option>
            <option value="traditional">Traditional F1 Points</option>
          </S.Select>
          {errors.scoring_system && (
            <S.ErrorText>{errors.scoring_system.message}</S.ErrorText>
          )}
          <S.HelpText>
            Inverted Position: 10th place = 10 pts, 1st place = 1 pt. Rewards
            mid-field picks.
          </S.HelpText>
        </S.FormGroup>

        <S.ButtonGroup>
          {onCancel && (
            <S.SecondaryButton
              type="button"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </S.SecondaryButton>
          )}
          <S.PrimaryButton type="submit" disabled={isLoading || !isValid || !isDirty}>
            {isLoading ? "Creating League..." : "Create League"}
          </S.PrimaryButton>
        </S.ButtonGroup>
      </S.Form>
    </S.FormContainer>
  );
};

export default CreateLeagueForm;
