import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";

export function useApiList<T>(resource: string, params?: Record<string, string>) {
  const fetch = useAuthenticatedFetch();
  const search = params ? "?" + new URLSearchParams(params).toString() : "";
  return useQuery<T[]>({
    queryKey: [resource, params],
    queryFn: () => fetch(`/api/${resource}${search}`).then((r) => r.data ?? r),
  });
}

export function useApiGet<T>(resource: string, id: string | undefined) {
  const fetch = useAuthenticatedFetch();
  return useQuery<T>({
    queryKey: [resource, id],
    queryFn: () => fetch(`/api/${resource}/${id}`).then((r) => r.data ?? r),
    enabled: !!id,
  });
}

export function useApiCreate<T>(resource: string) {
  const fetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation<T, Error, Partial<T>>({
    mutationFn: (data) =>
      fetch(`/api/${resource}`, {
        method: "POST",
        body: JSON.stringify(data),
      }).then((r) => r.data ?? r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function useApiUpdate<T>(resource: string) {
  const fetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation<T, Error, { id: string } & Partial<T>>({
    mutationFn: ({ id, ...data }) =>
      fetch(`/api/${resource}/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }).then((r) => r.data ?? r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function useApiDelete(resource: string) {
  const fetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      fetch(`/api/${resource}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}
