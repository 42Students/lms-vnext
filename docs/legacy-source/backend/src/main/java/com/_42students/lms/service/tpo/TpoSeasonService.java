package com._42students.lms.service.tpo;

import com._42students.lms.model.tpo.PlacementSeason;
import com._42students.lms.repository.tpo.PlacementSeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * A season is a filter, never a mode. Starting a new one never closes drives — real placement
 * seasons overlap (an earlier batch's offers are still resolving when the next batch's drives
 * start). See TPO V1 - Locked.docx §1/§9 and engineering review item 30.
 */
@Service
@RequiredArgsConstructor
public class TpoSeasonService {

    private final PlacementSeasonRepository seasonRepository;

    public List<PlacementSeason> seasonsFor(Integer collegeId) {
        return seasonRepository.findByCollegeIdOrderByStartDateDesc(collegeId);
    }

    public PlacementSeason current(Integer collegeId) {
        return seasonRepository.findFirstByCollegeIdAndIsCurrentTrueOrderByStartDateDesc(collegeId)
                .orElseGet(() -> startSeason(collegeId, "Current season", LocalDate.now(), null));
    }

    /** Never closes existing drives or other seasons — several may be "current" at once. */
    @Transactional
    public PlacementSeason startSeason(Integer collegeId, String name, LocalDate startDate, LocalDate endDate) {
        PlacementSeason season = new PlacementSeason();
        season.setCollegeId(collegeId);
        season.setName(name);
        season.setStartDate(startDate);
        season.setEndDate(endDate);
        season.setIsCurrent(true);
        return seasonRepository.save(season);
    }

    @Transactional
    public PlacementSeason openRegistration(Long seasonId, java.time.LocalDateTime deadline) {
        PlacementSeason season = seasonRepository.findById(seasonId).orElseThrow();
        season.setIsRegistrationOpen(true);
        season.setRegistrationDeadline(deadline);
        return seasonRepository.save(season);
    }
}
