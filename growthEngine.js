const STAGES = [
  {
    stage: "bud",
    threshold: 0,
    fruitSize: 18,
    clusterCenterY: 42,
    radiusX: 10,
    radiusY: 7.5,
    minDistance: 4.6,
    palette: "bud",
    nightMode: false,
    statusLine: "응원이 나무를 깨우는 중…"
  },
  {
    stage: "bloom",
    threshold: 12,
    fruitSize: 20,
    clusterCenterY: 41,
    radiusX: 12.5,
    radiusY: 9,
    minDistance: 4.8,
    palette: "bloom",
    nightMode: false,
    statusLine: "꽃봉오리가 열리고 있어…"
  },
  {
    stage: "leaf",
    threshold: 28,
    fruitSize: 22,
    clusterCenterY: 40,
    radiusX: 14,
    radiusY: 10.5,
    minDistance: 5,
    palette: "leaf",
    nightMode: false,
    statusLine: "잎과 꽃이 함께 나무를 채우는 중…"
  },
  {
    stage: "harvest",
    threshold: 56,
    fruitSize: 24,
    clusterCenterY: 39,
    radiusX: 15.5,
    radiusY: 11.8,
    minDistance: 5.1,
    palette: "harvest",
    nightMode: true,
    statusLine: "응원이 열매가 되어 반짝이고 있어…"
  }
];

export function getGrowthState(commentCount) {
  const active = STAGES.reduce((current, stage) => {
    return commentCount >= stage.threshold ? stage : current;
  }, STAGES[0]);

  const next = STAGES.find((stage) => stage.threshold > commentCount) || null;
  const progress = next
    ? (commentCount - active.threshold) / Math.max(1, next.threshold - active.threshold)
    : 1;

  return {
    ...active,
    commentCount,
    nextThreshold: next ? next.threshold : null,
    progress: Math.max(0, Math.min(1, progress))
  };
}
